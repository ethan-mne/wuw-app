// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Initialize Firebase
const app = initializeApp({
  apiKey: 'AIzaSyADp3jA0FljIY5mSmosrZUj0ISmj3-L6co',
  authDomain: 'winuwatch-bd56d.firebaseapp.com',
  projectId: 'winuwatch-bd56d',
  storageBucket: 'winuwatch-bd56d.appspot.com',
  messagingSenderId: '651859942451',
  appId: '1:651859942451:web:a1445d7cb0268b7a615746',
});

export const storage = getStorage(app);
export const analytics = () => {
  if (typeof window !== 'undefined') {
    return getAnalytics(app);
  } else {
    return null;
  }
};
