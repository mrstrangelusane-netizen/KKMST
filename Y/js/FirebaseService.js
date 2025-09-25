/**
 * FirebaseService - Centralized Firebase operations
 * Handles all Firebase authentication, Firestore, and configuration
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut,
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    doc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    limit,
    onSnapshot,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { firebaseConfig, appConfig } from './config.js';

export class FirebaseService {
    constructor() {
        this.app = null;
        this.auth = null;
        this.db = null;
        this.appId = appConfig.appId;
        this.initializeFirebase();
    }

    /**
     * Initialize Firebase configuration
     */
    initializeFirebase() {

        try {
            console.log('🔄 Initializing Firebase with config:', firebaseConfig);
            this.app = initializeApp(firebaseConfig);
            this.auth = getAuth(this.app);
            this.db = getFirestore(this.app);
            console.log('✅ Firebase initialized successfully');
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
        }
    }

    /**
     * Get Firestore instance
     */
    get firestore() {
        return this.db;
    }

    /**
     * Get Auth instance
     */
    get authentication() {
        return this.auth;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.auth ? this.auth.currentUser : null;
    }

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        if (!this.auth) {
            throw new Error('Firebase Auth not initialized');
        }

        const provider = new GoogleAuthProvider();
        return await signInWithPopup(this.auth, provider);
    }

    /**
     * Sign out
     */
    async signOut() {
        if (!this.auth) {
            throw new Error('Firebase Auth not initialized');
        }

        return await signOut(this.auth);
    }

    /**
     * Listen to authentication state changes
     */
    onAuthStateChanged(callback) {
        if (!this.auth) {
            throw new Error('Firebase Auth not initialized');
        }

        return onAuthStateChanged(this.auth, callback);
    }

    /**
     * Get Firestore collection reference
     */
    collection(path) {
        if (!this.db) {
            throw new Error('Firestore not initialized');
        }
        return collection(this.db, path);
    }

    /**
     * Get Firestore document reference
     */
    doc(path) {
        if (!this.db) {
            throw new Error('Firestore not initialized');
        }
        return doc(this.db, path);
    }

    /**
     * Get all documents from a collection
     */
    async getDocs(collectionRef) {
        if (!this.db) {
            throw new Error('Firestore not initialized');
        }
        return await getDocs(collectionRef);
    }

    /**
     * Add a document to a collection
     */
    async addDoc(collectionRef, data) {
        if (!this.db) {
            throw new Error('Firestore not initialized');
        }
        return await addDoc(collectionRef, data);
    }

    /**
     * Update a document
     */
    async updateDoc(docRef, data) {
        if (!this.db) {
            throw new Error('Firestore not initialized');
        }
        return await updateDoc(docRef, data);
    }

    /**
     * Delete a document
     */
    async deleteDoc(docRef) {
        if (!this.db) {
            throw new Error('Firestore not initialized');
        }
        return await deleteDoc(docRef);
    }

    /**
     * Create a query
     */
    createQuery(collectionRef, ...queryConstraints) {
        if (!this.db) {
            throw new Error('Firestore not initialized');
        }
        return query(collectionRef, ...queryConstraints);
    }

    /**
     * Listen to real-time updates
     */
    onSnapshot(collectionRef, callback, errorCallback) {
        if (!this.db) {
            throw new Error('Firestore not initialized');
        }
        return onSnapshot(collectionRef, callback, errorCallback);
    }

    /**
     * Create a batch for multiple operations
     */
    batch() {
        if (!this.db) {
            throw new Error('Firestore not initialized');
        }
        return writeBatch(this.db);
    }

    /**
     * Utility functions for common queries
     */
    
    /**
     * Get vouchers for a specific date
     */
    async getVouchersByDate(userId, date) {
        const vouchersCollection = this.collection(`artifacts/${this.appId}/users/${userId}/vouchers`);
        const q = this.createQuery(
            vouchersCollection,
            where('date', '==', date),
            orderBy('timestamp', 'desc')
        );
        return await this.getDocs(q);
    }

    /**
     * Get vouchers for a date range
     */
    async getVouchersByDateRange(userId, startDate, endDate) {
        const vouchersCollection = this.collection(`artifacts/${this.appId}/users/${userId}/vouchers`);
        const q = this.createQuery(
            vouchersCollection,
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            orderBy('date', 'desc'),
            orderBy('timestamp', 'desc')
        );
        return await this.getDocs(q);
    }

    /**
     * Get vouchers by technician
     */
    async getVouchersByTechnician(userId, technicianName) {
        const vouchersCollection = this.collection(`artifacts/${this.appId}/users/${userId}/vouchers`);
        const q = this.createQuery(
            vouchersCollection,
            where('technicianName', '==', technicianName),
            orderBy('timestamp', 'desc')
        );
        return await this.getDocs(q);
    }

    /**
     * Get all vouchers for a user (with pagination)
     */
    async getAllVouchers(userId, limitCount = 1000) {
        const vouchersCollection = this.collection(`artifacts/${this.appId}/users/${userId}/vouchers`);
        const q = this.createQuery(
            vouchersCollection,
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );
        return await this.getDocs(q);
    }

    /**
     * Get technicians for a user
     */
    async getTechnicians(userId) {
        const techniciansDoc = this.doc(`artifacts/${this.appId}/users/${userId}/technicians`);
        return await this.getDocs(this.collection(`artifacts/${this.appId}/users/${userId}`));
    }

    /**
     * Update technicians list
     */
    async updateTechnicians(userId, techniciansData) {
        const techniciansRef = this.doc(`artifacts/${this.appId}/users/${userId}/technicians`);
        return await this.updateDoc(techniciansRef, techniciansData);
    }

    /**
     * Add technician
     */
    async addTechnician(userId, technicianData) {
        const techniciansRef = this.doc(`artifacts/${this.appId}/users/${userId}/technicians`);
        return await this.updateDoc(techniciansRef, technicianData);
    }

    /**
     * Check if user is online
     */
    isOnline() {
        return navigator.onLine;
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            online: this.isOnline(),
            timestamp: new Date().toISOString()
        };
    }
}
