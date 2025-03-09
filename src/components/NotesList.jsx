import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import { useSearchParams, Link } from 'react-router-dom';
import { UserCircleIcon, FunnelIcon } from '@heroicons/react/24/solid';
import { shortener } from '../utils/utils';
import { useAuth } from '../utils/AuthContext';
import Pagination from '../components/Pagination';

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

// Sous-composant pour le tableau
const NotesTable = ({ searchQuery, statusFilter, currentPage, isModerator, onDeleteNote, onApproveNote }) => {
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = { 
          page: currentPage, 
          limit: pagination.limit,
          search: searchQuery || undefined 
        };
        if (statusFilter !== 'all') params.status = statusFilter;

        const response = await axios.get(`${API_CONFIG.baseUrl}api/notes`, { params });
        const fetchedNotes = Array.isArray(response.data.notes) ? response.data.notes : [];
        setNotes(fetchedNotes);
        setPagination(prev => ({ ...prev, ...response.data.pagination }));
      } catch (err) {
        console.error('Error fetching notes:', err);
        setError(err.message);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [currentPage, pagination.limit, statusFilter, searchQuery]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-400 text-black px-2 py-1 rounded border border-gray-300';
      case 'rejected': return 'bg-red-400 text-black px-2 py-1 rounded border border-gray-300';
      case 'pending': default: return 'bg-yellow-400 text-black px-2 py-1 rounded border border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-40">
        <span className="loading loading-spinner loading-md text-primary"></span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <>
      <div className="mb-4 text-sm text-gray-600">
        {`${pagination.total} Note${pagination.total !== 1 ? 's' : ''} found`}
      </div>
      <div className="overflow-x-auto mt-4">
        <div className="max-h-[70vh] overflow-y-auto border border-gray-300 rounded-lg">
          <table className="min-w-full border-collapse">
            <thead className="bg-base-100">
              <tr className="border-b border-gray-300">
                <th className="p-4 text-left sticky top-0 bg-base-100 z-10 border-r border-gray-300">Target Wallet</th>
                <th className="p-4 text-left sticky top-0 bg-base-100 z-10 border-r border-gray-300">Content</th>
                <th className="p-4 text-center sticky top-0 bg-base-100 z-10 border-r border-gray-300">Status</th>
                <th className="p-4 text-left sticky top-0 bg-base-100 z-10 border-r border-gray-300">Author</th>
                <th className="p-4 text-center sticky top-0 bg-base-100 z-10 border-r border-gray-300">Date</th>
                <th className="p-4 text-center sticky top-0 bg-base-100 z-10 border-r border-gray-300">Score</th>
                {isModerator && <th className="p-4 text-center sticky top-0 bg-base-100 z-10">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {notes.length > 0 ? (
                notes.map(note => (
                  <tr key={note._id} className="border-t border-gray-300">
                    <td className="p-4 border-r border-gray-300">
                      <Link to={`/wallet/${note.walletAddress}`} className="text-primary underline font-mono text-xs">
                        {shortener(note.walletAddress)}
                      </Link>
                    </td>
                    <td className="p-4 border-r border-gray-300">
                      {note.content.length > 50 ? `${note.content.substring(0, 50)}...` : note.content}
                    </td>
                    <td className="p-4 text-center border-r border-gray-300">
                      <span className={getStatusBadgeClass(note.status)}>
                        {note.status.charAt(0).toUpperCase() + note.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 border-r border-gray-300">
                      <Link to={`/wallet/${note.author}`} className="flex items-center text-primary underline">
                        <UserCircleIcon className="h-4 w-4 mr-1" />
                        {shortener(note.author)}
                      </Link>
                    </td>
                    <td className="p-4 text-center border-r border-gray-300">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center border-r border-gray-300">{note.score}</td>
                    {isModerator && (
                      <td className="p-4 text-center">
                        <div className="flex items-center gap-2">
                          {note.status === 'pending' && (
                            <button
                              onClick={() => onApproveNote(note._id, note.walletAddress)}
                              className="btn btn-xs bg-green-500 text-white hover:bg-green-600"
                              disabled={loading}
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteNote(note._id)}
                            className="btn btn-xs bg-red-500 text-white hover:bg-red-600"
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr className="border-t border-gray-300">
                  <td colSpan={isModerator ? 7 : 6} className="p-4 text-center">No notes found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {!loading && notes.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.pages}
          onPageChange={(newPage) => setSearchParams({ page: newPage, status: statusFilter, ...(searchQuery && { search: searchQuery }) })}
          itemsPerPage={pagination.limit}
          totalItems={pagination.total}
        />
      )}
    </>
  );
};

const NotesList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isModerator, isLoading: authLoading } = useAuth();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const currentPage = parseInt(searchParams.get('page')) || 1;
  const statusFilter = searchParams.get('status') || 'all';
  const searchQuery = searchParams.get('search') || '';

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      const token = getCookie('authToken');
      const response = await axios.delete(`${API_CONFIG.baseUrl}api/notes/${noteId}`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
        validateStatus: () => true,
      });

      if (response.status === 200) {
        // Le tableau se mettra à jour via useEffect
      } else {
        alert(response.status === 403 ? 'Forbidden: Only moderators can delete notes.' : 'Failed to delete note.');
      }
    } catch (err) {
      alert('An error occurred while deleting the note.');
    }
  };

  const handleApproveNote = async (noteId, walletAddress) => {
    try {
      const token = getCookie('authToken');
      const response = await axios.put(
        `${API_CONFIG.baseUrl}api/wallets/${walletAddress}/notes/${noteId}/approve`,
        {},
        { headers: { Authorization: token ? `Bearer ${token}` : undefined }, validateStatus: () => true }
      );

      if (response.status === 200) {
        // Le tableau se mettra à jour via useEffect
      } else {
        alert(response.status === 403 ? 'Forbidden: Only moderators can approve notes.' : 'Failed to approve note.');
      }
    } catch (err) {
      alert('An error occurred while approving the note.');
    }
  };

  const handleStatusFilterChange = (e) => {
    setSearchParams({ 
      page: 1, 
      status: e.target.value,
      ...(searchQuery && { search: searchQuery })
    });
  };

  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setSearchInput(newValue);
    setSearchParams({ 
      page: '1', 
      status: statusFilter,
      ...(newValue && { search: newValue })
    });
  };

  if (authLoading) {
    return (
      <div className="container mx-auto p-4 text-base-content">
        <div className="flex justify-center items-center min-h-40">
          <span className="loading loading-spinner loading-md text-primary"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 text-base-content">
      <h1 className="text-2xl font-bold mb-4">Notes</h1>

      {/* Search and Status Filter */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search notes by content"
            className="w-full sm:w-60 p-2 text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FunnelIcon className="h-5 w-5 text-primary" />
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="w-full sm:w-60 p-2 text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All Notes</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <NotesTable
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        currentPage={currentPage}
        isModerator={isModerator}
        onDeleteNote={handleDeleteNote}
        onApproveNote={handleApproveNote}
      />
    </div>
  );
};

export default NotesList;