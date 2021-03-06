import Vue from 'vue'
import Vuex from 'vuex'
import * as firebase from 'firebase'


Vue.use(Vuex)

export const store = new Vuex.Store({
  // stored data
  state: {
    loadedfileUploads:[],
    loadedRatings: [],
    user: null, // default: no user
    loading: false,
    error: null
  },
  // mutate state
  // called by commit "actions" part of this same file
  mutations: {
    setLoadedfileUploads (state, payload) {
      state.loadedfileUploads = payload
    },
    setLoadedRatings (state, payload){
      state.loadedRatings = payload
    },
    createfileUpload (state, payload) {
      state.loadedfileUploads.push(payload)
    },
    addRating (state, payload) {
      state.loadedRatings.push(payload)
    },
    setUser (state, payload) {
      state.user = payload
    },
    setLoading (state, payload) {
      state.loading = payload
    },
    setError (state, payload) {
      state.error = payload
    },
    clearError (state) {
      state.error = null
    }
  },

  // asynchronous tasks
  actions: {
    loadfileUploads ({commit}, payload) {
      commit('setLoading', true)
      // reach out to the fileUpload node
      // on('value'): listen to any value changes and get push notifications
      // once('value'): get the snapshot once
      firebase.database().ref(payload).child('files').once('value')
        .then((data) => {
          const fileUploads = []
          const obj = data.val() // .val() will get you the value of the response
          // data.val is an object, not an array
          // The "let" statement declares a block-scoped local variable, optionally initializing it to a value.
          // loop through the object, same as for(key in obj), but limit key to block scope by "let"
          for (let key in obj) {
            fileUploads.push({
              id: key,
              type: obj[key].type,
              description: obj[key].description,
              imageUrl: obj[key].imageUrl,
              date: obj[key].date,
              filename: obj[key].filename
              // creatorId: obj[key].creatorId
            })
          }
          commit('setLoadedfileUploads', fileUploads)
          commit('setLoading', false)
        })
        .catch(
          (error) => {
            console.log(error)
            commit('setLoading', false)
          }
        )
    },
    loadRatings ({commit}, payload) {
      commit('setLoading', true)
      // reach out to the fileUpload node
      // on('value'): listen to any value changes and get push notifications
      // once('value'): get the snapshot once
      firebase.database().ref(payload).child('rating').once('value')
        .then((data) => {
          const fileUploads = []
          const obj = data.val() // .val() will get you the value of the response
          // data.val is an object, not an array
          // The "let" statement declares a block-scoped local variable, optionally initializing it to a value.
          // loop through the object, same as for(key in obj), but limit key to block scope by "let"
          for (let key in obj) {
            fileUploads.push({
              id: key,
              comment: obj[key].comment,
              rate: obj[key].rate,
              time: obj[key].time,
              user: obj[key].user
            })
          }
          commit('setLoadedRatings', fileUploads)
          commit('setLoading', false)
        })
        .catch(
          (error) => {
            console.log(error)
            commit('setLoading', false)
          }
        )
    },
    createfileUpload ({commit, getters}, payload) {
      let imageUrl
      let key
      const classname = payload.classname
      const fileUpload = {
        type: payload.type,
        date: payload.date.toISOString(),
        filename: payload.image.name,
        description: payload.description,
        classname: payload.classname
        // creatorId: getters.user.id
      }
      //************** STEP 1: ******************
      // push json information to database
      firebase.database().ref(classname).child('files').push(fileUpload)
        .then((data) => {
          key = data.key // data we get back from firebase contains the key of this object
          return key
        })
        //************** STEP 2 ******************
        // use store image into storage
        .then(key => {
          const filename = payload.image.name
          // const ext = filename.slice(filename.lastIndexOf('.'))
          // upload fire to the storage part of the firebase. for files we use put('xxx') to upload
          return firebase.storage().ref('fileUploads/' + classname + '/' + filename).put(payload.image)
          // return firebase.storage().ref('fileUploads/' + key + '.' + ext).put(payload.image)
        })
        // A promise is an object that may produce a single value some time in the future : either a resolved value, or a reason that it's not resolved
        // this step is needed to get DownloadURL?
        .then(snapshot => {
          return new Promise((resolve, reject) => {
            snapshot.ref.getDownloadURL().then(url => {
              snapshot.downloadURL = url
              resolve(snapshot)
            })
          })
        })
        .then((snapshot) => {
          imageUrl = snapshot.downloadURL
          //************** STEP 3: ******************
          // update a node "fileUploads", child(key)
          return firebase.database().ref(classname).child('files').child(key).update({imageUrl: imageUrl})
        })
        // commit in local store
        //************** STEP 4: ******************
        .then(() => {
          commit('createfileUpload', {
            ...fileUpload,
            imageUrl: imageUrl,
            id: key
          })
        })
        .catch((error) => {
          console.log(error)
        })
    },
    addRating ({commit, getters}, payload) {
      let imageUrl
      let key
      const classname = payload.classname

      const fileUpload = {
        rate: payload.rate,
        user: payload.user,
        comment: payload.comment,
        time: payload.time.toISOString(),
        classname: payload.classname
        // creatorId: getters.user.id
      }
      // push json information to database
      firebase.database().ref(classname).child('rating').push(fileUpload)
        .then((data) => {
          key = data.key // data we get back from firebase contains the key of this object
          return key
        })
        // commit locally
        .then(() => {
          commit('addRating', {
            ...fileUpload,
            id: key
          })
        })
        .catch((error) => {
          console.log(error)
        })
    },
    
    signUserUp ({commit}, payload) {
      // loading
      commit('setLoading', true)
      commit('clearError')
      firebase.auth().createUserWithEmailAndPassword(payload.email, payload.password)
        .then(
          user => {
            
            commit('setLoading', false) // not loading anymore
            const newUser = {
              id: user.uid,
              registeredfileUploads: []
            }
            commit('setUser', newUser)
          }
        )
        .catch(
          error => {
            commit('setLoading', false) // not loading anymore
            commit('setError', error) // saves the error
            console.log(error)
          }
        )
    },
    signUserIn ({commit}, payload) {
      commit('setLoading', true)
      commit('clearError')
      firebase.auth().signInWithEmailAndPassword(payload.email, payload.password)
        .then(
          user => {
            commit('setLoading', false)
            const newUser = {
              id: user.uid,
              registeredfileUploads: []
            }
            commit('setUser', newUser)
          }
        )
        .catch(
          error => {
            commit('setLoading', false)
            commit('setError', error)
            console.log(error)
          }
        )
    },
    autoSignIn ({commit}, payload) {
      commit('setUser', {id: payload.uid, registeredfileUploads: []})
    },
    logout ({commit}) {
      firebase.auth().signOut()
      commit('setUser', null)
    },
    clearError ({commit}) {
      commit('clearError')
    }
  },
  getters: {
    loadedfileUploads (state) {
      return state.loadedfileUploads
      // return state.loadedfileUploads.sort((fileUploadA, fileUploadB) => {
      //   return fileUploadA.date > fileUploadB.date
      // })
    },
    featuredfileUploads (state, getters) {
      return getters.loadedfileUploads.slice(0, 5)
    },
    loadedfileUpload (state) {
      return (fileUploadId) => {
        return state.loadedfileUploads.find((fileUpload) => {
          return fileUpload.id === fileUploadId
        })
      }
    },
    loadedRatings (state) {
      return state.loadedRatings
    },

    user (state) {
      return state.user
    },
    loading (state) {
      return state.loading
    },
    error (state) {
      return state.error
    }
  }
})
