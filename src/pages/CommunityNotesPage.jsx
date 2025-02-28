import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import NotesList from '../components/NotesList';

const CommunityNotesPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notesData, setNotesData] = useState(null);

  useEffect(() => {
    const fetchNotesData = async () => {
      setIsLoading(true);
      try {
        // Fetch community notes data
        const notesResponse = await axios.get(`${API_CONFIG.baseUrl}community-notes`, {
          validateStatus: (status) => true // Custom status handling
        });

        if (notesResponse.status === 200) {
          setNotesData(notesResponse.data);
          setError(null);
        } else {
          setError(`Error ${notesResponse.status}: ${notesResponse.data.message || 'Unable to load community notes'}`);
          setNotesData(null);
        }
      } catch (error) {
        console.error("Error fetching community notes:", error);
        setError("An error occurred while communicating with the server.");
        setNotesData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotesData();
  }, []);

  // Display during loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  // Display in case of error
  if (error) {
    return (
      <div className="rounded-xl shadow-xl p-4 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-1">
      <div className="rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-base-content">Community Notes</h2>
        <NotesList />
      </div>
    </div>
  );
};

export default CommunityNotesPage;