import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { VideoItem, CommentPin, PhotoItem, TextPostItem, GifItem } from '../types';
import { INITIAL_VIDEOS, getDeletedVideoIds } from './storage';
import { getSafeVideoUrl } from './videoBlobService';

// Sync Videos from Firestore
export function subscribeToFirestoreVideos(callback: (videos: VideoItem[]) => void) {
  try {
    const q = query(collection(db, 'videos'), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const deletedIds = getDeletedVideoIds();
        if (!snapshot.empty) {
          const firestoreVideos: VideoItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as VideoItem;
            if (deletedIds.has(data.id)) return;
            const initMatch = INITIAL_VIDEOS.find((iv) => iv.id === data.id);
            const finalUrl = initMatch
              ? initMatch.videoUrl
              : (data.videoUrl || getSafeVideoUrl(data.videoUrl, data.format, data.id));
            firestoreVideos.push({
              ...data,
              videoUrl: finalUrl
            });
          });
          // Merge with initial videos if needed
          const merged = [...firestoreVideos];
          INITIAL_VIDEOS.forEach((initV) => {
            if (!deletedIds.has(initV.id) && !merged.some((v) => v.id === initV.id)) {
              merged.push(initV);
            }
          });
          callback(merged);
        } else {
          callback(INITIAL_VIDEOS.filter((v) => !deletedIds.has(v.id)));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'videos');
        const deletedIds = getDeletedVideoIds();
        callback(INITIAL_VIDEOS.filter((v) => !deletedIds.has(v.id)));
      }
    );
  } catch (error) {
    console.warn('Fallback to local videos:', error);
    const deletedIds = getDeletedVideoIds();
    callback(INITIAL_VIDEOS.filter((v) => !deletedIds.has(v.id)));
    return () => {};
  }
}

// Publish Video to Firestore
export async function publishVideoToFirestore(video: VideoItem) {
  try {
    const videoRef = doc(db, 'videos', video.id);
    await setDoc(videoRef, video);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `videos/${video.id}`);
  }
}

// Delete Video from Firestore
export async function deleteVideoFromFirestore(videoId: string) {
  try {
    const videoRef = doc(db, 'videos', videoId);
    await deleteDoc(videoRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `videos/${videoId}`);
  }
}

// Publish Photo to Firestore
export async function publishPhotoToFirestore(photo: PhotoItem) {
  try {
    const photoRef = doc(db, 'videos', photo.id);
    await setDoc(photoRef, {
      ...photo,
      format: 'photo',
      videoUrl: photo.imageUrl,
      thumbnailUrl: photo.imageUrl
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `videos/${photo.id}`);
  }
}

// Publish Post to Firestore
export async function publishPostToFirestore(post: TextPostItem) {
  try {
    const postRef = doc(db, 'comments', post.id);
    await setDoc(postRef, {
      ...post,
      videoId: 'general_community',
      userId: post.author.username,
      author: post.author.name,
      text: post.content
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `comments/${post.id}`);
  }
}

// Publish Comment Pin to Firestore
export async function publishPinToFirestore(videoId: string, pin: CommentPin) {
  try {
    const pinRef = doc(db, 'commentPins', pin.id);
    await setDoc(pinRef, {
      ...pin,
      videoId
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `commentPins/${pin.id}`);
  }
}

export const subscribeToVideos = subscribeToFirestoreVideos;
