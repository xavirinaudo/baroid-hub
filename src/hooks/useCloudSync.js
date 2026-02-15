import { useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export const useCloudSync = (
    sectors,
    setSectors
) => {
    const { currentUser, authReady } = useAuth();

    // 1. Subir cambios locales a la nube (Push)
    useEffect(() => {
        if (!authReady || !currentUser) return;

        const saveData = async () => {
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                await setDoc(userDocRef, {
                    sectors,
                    lastUpdated: new Date().toISOString()
                }, { merge: true });
                console.log("Cambios locales sincronizados a Firestore.");
            } catch (error) {
                console.error("Error sincronizando a Firestore:", error);
            }
        };

        const timeoutId = setTimeout(saveData, 2000); // Debounce de 2s
        return () => clearTimeout(timeoutId);
    }, [sectors, currentUser, authReady]);


    // 2. Bajar cambios de la nube (Pull)
    useEffect(() => {
        if (!authReady || !currentUser) return;

        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                if (data.sectors) {
                    setSectors((prev) => {
                        // Comprobación de integridad para evitar loops
                        // Solo actualiza si JSON stringify es diferente
                        if (JSON.stringify(prev) !== JSON.stringify(data.sectors)) {
                            console.log("Datos actualizados desde Firestore.");
                            return data.sectors;
                        }
                        return prev;
                    });
                }
            }
        });

        return () => unsubscribe();
    }, [currentUser, authReady, setSectors]);
};
