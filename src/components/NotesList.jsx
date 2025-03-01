import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, UserCircleIcon, FunnelIcon } from '@heroicons/react/24/solid';
import { shortener } from '../utils/utils';
import { useAuth } from '../utils/AuthContext';

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

const NotesList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isModerator, isLoading: authLoading } = useAuth();
  
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const statusFilter = searchParams.get('status') || 'all';

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError(null);

        // Include the status filter in the API request if it's not 'all'
        const params = {
          page: currentPage,
          limit: pagination.limit,
        };
        
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }

        const response = await axios.get(`${API_CONFIG.baseUrl}api/notes`, {
          params,
        });

        const fetchedNotes = Array.isArray(response.data.notes) ? response.data.notes : [];
        setNotes(fetchedNotes);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination,
        }));
      } catch (err) {
        console.error('Error fetching notes:', err);
        setError(err.message);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchNotes();
    }
  }, [currentPage, pagination.limit, authLoading, statusFilter]);

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      setLoading(true);
      const token = getCookie('authToken');
      const response = await axios.delete(`${API_CONFIG.baseUrl}api/notes/${noteId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        validateStatus: (status) => true,
      });

      if (response.status === 200) {
        setNotes(notes.filter(note => note._id !== noteId));
        setPagination(prev => ({
          ...prev,
          total: prev.total - 1,
        }));
      } else if (response.status === 403) {
        setError('Forbidden: Only moderators can delete notes.');
      } else if (response.status === 404) {
        setError('Note not found.');
      } else {
        setError(`Error ${response.status}: ${response.data.message || 'Failed to delete note'}`);
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('An error occurred while deleting the note.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveNote = async (noteId, walletAddress) => {
    try {
      setLoading(true);
      const token = getCookie('authToken');
      const response = await axios.put(
        `${API_CONFIG.baseUrl}api/wallets/${walletAddress}/notes/${noteId}/approve`,
        {},
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          validateStatus: (status) => true,
        }
      );

      if (response.status === 200) {
        setNotes(notes.map(note =>
          note._id === noteId ? { ...note, status: 'approved', approvedAt: new Date() } : note
        ));
      } else if (response.status === 403) {
        setError('Forbidden: Only moderators can approve notes.');
      } else if (response.status === 404) {
        setError('Note not found or not in pending status.');
      } else {
        setError(`Error ${response.status}: ${response.data.message || 'Failed to approve note'}`);
      }
    } catch (err) {
      console.error('Error approving note:', err);
      setError('An error occurred while approving the note.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setSearchParams({ page: newPage, status: statusFilter });
    }
  };

  const handleStatusFilterChange = (status) => {
    setSearchParams({ page: 1, status });
  };

  const renderPagination = () => {
    const { page, pages, total } = pagination;

    if (total === 0) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between my-6 gap-4">
        <div className="text-sm text-base-content">
          Showing {(page - 1) * pagination.limit + 1} to{' '}
          {Math.min(page * pagination.limit, total)} of {total} notes
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || loading}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === pages || loading}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderStatusFilter = () => {
    return (
      <div className="flex items-center space-x-2 mb-6">
        <FunnelIcon className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium">Filter by status:</span>
        <select 
          value={statusFilter} 
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          className="select-bordered select-sm text-black rounded-lg"
        >
          <option value="all">All notes</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
    );
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'badge badge-success';
      case 'rejected':
        return 'badge badge-error';
      case 'pending':
      default:
        return 'badge badge-warning';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-40">
        <span className="loading loading-spinner loading-md text-primary"></span>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-4 text-error">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto py-6 text-base-content max-w-lgx2">

      
      {/* Status filter dropdown */}
      {renderStatusFilter()}
      
      {/* Top pagination */}
      {renderPagination()}

      {notes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Target Wallet</th>
                <th>Content</th>
                <th>Status</th>
                <th>Author</th>
                <th>Date</th>
                <th>Score</th>
                {isModerator && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {notes.map((note) => (
                <tr key={note._id}>
                  <td className="font-mono text-xs">
                    <Link to={`/wallet/${note.walletAddress}`} className="link">
                      {shortener(note.walletAddress)}
                    </Link>
                  </td>
                  <td>{note.content.length > 50 ? `${note.content.substring(0, 50)}...` : note.content}</td>
                  <td>
                    <span className={getStatusBadgeClass(note.status)}>
                      {note.status.charAt(0).toUpperCase() + note.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <Link to={`/wallet/${note.author}`} className="flex items-center">
                      <UserCircleIcon className="h-4 w-4 mr-1 text-primary" />
                      {shortener(note.author)}
                    </Link>
                  </td>
                  <td>{new Date(note.createdAt).toLocaleDateString()}</td>
                  <td>{note.score}</td>
                  {isModerator && (
                    <td>
                      <div className="flex items-center gap-2">
                        {note.status === 'pending' && (
                          <button
                            onClick={() => handleApproveNote(note._id, note.walletAddress)}
                            className="btn btn-xs btn-success"
                            disabled={loading}
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNote(note._id)}
                          className="btn btn-xs btn-error"
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>No notes found</span>
        </div>
      )}

      {/* Bottom pagination */}
      {renderPagination()}
    </div>
  );
};

export default NotesList;