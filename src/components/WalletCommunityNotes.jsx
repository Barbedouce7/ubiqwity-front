import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  HandThumbUpIcon, 
  HandThumbDownIcon, 
  PlusCircleIcon, 
  UserCircleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/solid';
import { API_CONFIG } from '../utils/apiConfig';
import { useAuth } from '../utils/AuthContext'; 

const WalletCommunityNotes = ({ walletAddress }) => {
  const { isAuthenticated, isModerator, isLoading: authLoading } = useAuth(); 
  const [wallet, setWallet] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('approved');
  const [newNote, setNewNote] = useState('');

  // Function to load wallet data and its notes
  const fetchWalletData = useCallback(async () => {
    try {
      setLoading(true);

      // Get wallet information
      const walletRes = await axios.get(`${API_CONFIG.baseUrl}api/wallets/${walletAddress}`);
      setWallet(walletRes.data.wallet);
      
      // Get notes with status filter
      const notesRes = await axios.get(`${API_CONFIG.baseUrl}api/wallets/${walletAddress}/notes`, {
        params: { status: statusFilter },
        headers: {
          Authorization: getCookie('authToken') ? `Bearer ${getCookie('authToken')}` : undefined
        }
      });

      // Ensure notes is an array
      if (Array.isArray(notesRes.data)) {
        setNotes(notesRes.data);
      } else if (notesRes.data && notesRes.data.notes && Array.isArray(notesRes.data.notes)) {
        setNotes(notesRes.data.notes);
      } else {
        setNotes([]);
      }
      
      setError(null);
    } catch (err) {
      setError('Error loading data: ' + err.message);
      console.error(err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, statusFilter]);

  // Helper to get a cookie (copied from AuthContext)
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    // Reset filter to 'approved' if user is not moderator and using a restricted filter
    if (!isModerator && (statusFilter === 'rejected' || statusFilter === '')) {
      setStatusFilter('approved');
    } else {
      fetchWalletData();
    }
  }, [fetchWalletData, isModerator, statusFilter]);

  // Function to vote on a note (only for authenticated users)
  const handleVote = async (noteId, value) => {
    if (!isAuthenticated) return;
    
    try {
      await axios.post(`${API_CONFIG.baseUrl}api/notes/${noteId}/vote`, {
        value
      }, {
        headers: {
          Authorization: `Bearer ${getCookie('authToken')}`
        }
      });
      // Refresh notes after voting
      fetchWalletData();
    } catch (err) {
      setError('Error when voting: ' + (err.response?.data?.message || err.message));
    }
  };

  // Function to submit a new note (only for authenticated users)
  const handleSubmitNote = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !newNote.trim()) return;
    
    try {
      await axios.post(`${API_CONFIG.baseUrl}api/wallets/${walletAddress}/notes`, {
        content: newNote
      }, {
        headers: {
          Authorization: `Bearer ${getCookie('authToken')}`
        }
      });
      setNewNote('');
      // Refresh notes after submission
      fetchWalletData();
    } catch (err) {
      setError('Error when submitting: ' + (err.response?.data?.message || err.message));
    }
  };

  // Wait for authentication to be verified
  if (authLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="rounded-box p-6 shadow-lg flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
        </div>
      </div>
    );
  }

  // Interface rendering
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="rounded-box p-6 shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Community Notes
            {wallet && <span className="text-sm ml-2 opacity-70">for {wallet.address.substring(0, 8)}...</span>}
          </h1>
          <div className="badge badge-primary badge-lg">Beta</div>
        </div>

        {/* Loading state and errors */}
        {loading && <div className="flex justify-center my-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div></div>}
        {error && (
          <div className="alert alert-error mb-4">
            <ExclamationCircleIcon className="h-6 w-6 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters - Conditional display based on user rights 
        <div className="tabs mb-6">
          <a 
            className={`tab-custom cursor-pointer ${statusFilter === 'approved' ? 'tab-active' : ''}`}
            onClick={() => setStatusFilter('approved')}
          >
            Approved
          </a>
          
          {isAuthenticated && (
            <a 
              className={`tab-custom cursor-pointer ${statusFilter === 'pending' ? 'tab-active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              Pending
            </a>
          )}
          
          {isModerator && (
            <>
              <a 
                className={`tab-custom cursor-pointer ${statusFilter === 'rejected' ? 'tab-active' : ''}`}
                onClick={() => setStatusFilter('rejected')}
              >
                Rejected
              </a>
              <a 
                className={`tab-custom cursor-pointer ${!statusFilter ? 'tab-active' : ''}`}
                onClick={() => setStatusFilter('')}
              >
                All
              </a>
            </>
          )}
        </div>*/}

        {/* Notes list */}
        <div className="space-y-4 mb-4">
          {Array.isArray(notes) && notes.length === 0 && !loading ? (
            <div className="alert alert-info">
              <div className="flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 mx-2 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <label>No notes available at the moment.</label>
              </div>
            </div>
          ) : (
            Array.isArray(notes) && notes.map(note => (
              <NoteCard 
                key={note._id} 
                note={note} 
                onVote={handleVote}
                isAuthenticated={isAuthenticated}
              />
            ))
          )}
        </div>

        {/* Note submission form - Only for authenticated users */}
        {isAuthenticated && (
          <form onSubmit={handleSubmitNote} className="mb-8">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Add your comment:</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Share your knowledge about this wallet"
                  className="input input-bordered w-full"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  <PlusCircleIcon className="h-5 w-5 mr-2" />
                  Add
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Message for non-authenticated users */}
        {!isAuthenticated && (
          <div className="alert alert-info mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Log in to add comments and vote.</span>
          </div>
        )}

      </div>
    </div>
  );
};

// Component to display a note
const NoteCard = ({ note, onVote, isAuthenticated }) => {
  // Function to truncate author ID
  const formatAuthorId = (authorId) => {
    return typeof authorId === 'string' 
      ? authorId.substring(0, 8) + '...'
      : 'Anonymous';
  };
  
  // Get status icon and class
  const getStatusInfo = (status) => {
    switch(status) {
      case 'approved':
        return { 
          icon: <CheckCircleIcon className="h-5 w-5" />,
          className: 'badge-success'
        };
      case 'rejected':
        return { 
          icon: <XCircleIcon className="h-5 w-5" />,
          className: 'badge-error'
        };
      case 'pending':
      default:
        return { 
          icon: <ExclamationCircleIcon className="h-5 w-5" />,
          className: 'badge-warning'
        };
    }
  };
  
  const statusInfo = getStatusInfo(note.status);
  
  return (
    <div className="shadow-md">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center mb-2">
            <UserCircleIcon className="h-6 w-6 mr-2 text-primary" />
            <span className="text-sm opacity-75">{formatAuthorId(note.author)}</span>
            <span className="text-xs opacity-50 ml-2">
              {new Date(note.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className={`badge ${statusInfo.className} gap-1`}>
            {statusInfo.icon}
            {note.status === 'approved' ? 'Approved' : 
             note.status === 'rejected' ? 'Rejected' : 'Pending'}
          </div>
        </div>
        
        <p className="text-lg mb-4">{note.content}</p>
        
        <div className="flex justify-between items-center">
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => onVote(note._id.toString(), 1)}
                className="btn btn-sm btn-outline btn-success gap-1"
              >
                <HandThumbUpIcon className="h-5 w-5" />
                Yes
              </button>
              
              <button 
                onClick={() => onVote(note._id.toString(), -1)}
                className="btn btn-sm btn-outline btn-error gap-1"
              >
                <HandThumbDownIcon className="h-5 w-5" />
                No
              </button>
            </div>
          ) : (
            <div></div> // Placeholder to maintain layout when buttons are hidden
          )}
          
          <div className="badge badge-lg">
            Score: {note.score}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletCommunityNotes;