import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import { useAuth } from '../utils/AuthContext'; 
import NotesList from '../components/NotesList';

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

const ProfilPage = () => {
  const [profilData, setProfilData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const fetchProfilData = async () => {
      if (authLoading) return; // Attendre que le statut d'authentification soit chargé
      
      setIsLoading(true);
      try {
        const token = getCookie('authToken');
        
        // Récupérer les données du profil avec le header d'authentification
        const profilResponse = await axios.get(`${API_CONFIG.baseUrl}profil`, { 
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          validateStatus: (status) => true // Pour gérer nous-mêmes les statuts d'erreur
        });
        
        
        if (profilResponse.status === 200) {
          setProfilData(profilResponse.data);
          setError(null);
        } else if (profilResponse.status === 403) {
          setError("Accès non autorisé. Veuillez vous connecter pour voir votre profil.");
          setProfilData(null);
        } else {
          setError(`Erreur ${profilResponse.status}: ${profilResponse.data.message || 'Impossible de charger les données du profil'}`);
          setProfilData(null);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données du profil:", error);
        setError("Une erreur est survenue lors de la communication avec le serveur.");
        setProfilData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfilData();
  }, [authLoading, isAuthenticated]);

  // Affichage pendant le chargement de l'authentification
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  // Affichage si l'utilisateur n'est pas authentifié
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="rounded-xl shadow-xl p-6 text-center">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => window.location.href = '/login'}
        >
          Connect
        </button>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error && !isLoading) {
    return (
      <div className="rounded-xl shadow-xl p-4 text-center">
        <p className="text-red-500">{error}</p>
        {error.includes("connecter") && (
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => window.location.href = '/login'}
          >
            Se connecter
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-1">
      {isLoading ? (
        <div className="flex justify-center items-center min-h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
        </div>
      ) : (
        <div className="rounded-xl shadow-xl p-6">
          <h2 className="text-xl font-bold mb-4">Profil User</h2>
          
   
          {profilData?.stakeKey && (
            <div className="mb-4">
              <p className="font-medium">Stake Key:</p>
              <p className="text-sm p-2 rounded overflow-x-auto">
                {profilData.stakeKey}
              </p>
            </div>
          )}
 
          {profilData?.message && (
            <div className="mb-4 p-2 rounded">
              <p>{profilData.message}</p>
            </div>
          )}
          

          <div className=" p-4 rounded-lg overflow-auto max-h-96">
            <p className="text-sm font-medium mb-2">data:</p>
            <pre className="text-sm whitespace-pre-wrap break-words">
              {JSON.stringify(profilData, null, 2)}
            </pre>
          </div>
              

        </div>
      )}
    </div>
  );
};

export default ProfilPage;