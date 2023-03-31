importScripts("https://www.gstatic.com/firebasejs/9.8.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.8.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.

firebase.initializeApp({
    apiKey: "AIzaSyDyXQXVHV6MuvDvAFSp6X1_zxwBR024MMg",
    authDomain: "angularcarsh.firebaseapp.com",
    projectId: "angularcarsh",
    storageBucket: "angularcarsh.appspot.com",
    messagingSenderId: "901028259185",
    appId: "1:901028259185:web:04eae6a3afa5dd625802d0",
    measurementId: 'G-EDGXMLKVKQ'
})

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.


// firebase.initializeApp(environment.firebase);
console.log("serviice workerrrrrrrrrrrrrrr");
const messaging = firebase.messaging();