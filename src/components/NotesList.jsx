import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
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

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`${API_CONFIG.baseUrl}api/notes`, {
          params: {
            page: currentPage,
            limit: pagination.limit,
          },
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
  }, [currentPage, pagination.limit, authLoading]);

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

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setSearchParams({ page: newPage });
    }
  };

  const renderPagination = () => {
    const { page, pages, total } = pagination;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
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

  if (authLoading || loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-error">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 text-base-content">
      <h1 className="text-2xl font-bold mb-6 text-center md:text-left">Notes List</h1>

      <div className="space-y-6">
        {notes.length > 0 ? (
          notes.map((note) => (
            <div
              key={note._id}
              className="flex flex-col md:flex-row justify-between items-start gap-4 p-4 border-b border-base-200"
            >
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold">Content: </span>
                  <span className="break-words">{note.content}</span>
                </div>
                <div>
                  <span className="font-semibold">Author: </span>
                  <Link className="link link-primary" to={`/address/${note.author}`}>
                    {shortener(note.author)}
                  </Link>
                </div>
                <div>
                  <span className="font-semibold">Wallet: </span>
                  <Link className="link link-primary" to={`/address/${note.walletAddress}`}>
                    {shortener(note.walletAddress)}
                  </Link>
                </div>
                <div>
                  <span className="font-semibold">Created: </span>
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-semibold">Score: </span>
                  <span>{note.score}</span>
                </div>
                <div>
                  <span className="font-semibold">Status: </span>
                  <span>{note.status}</span>
                </div>
              </div>
              {isModerator && (
                <button
                  onClick={() => handleDeleteNote(note._id)}
                  className="btn btn-sm btn-error self-end md:self-start"
                  disabled={loading}
                >
                  Delete
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-4">No notes found</div>
        )}
      </div>

      {pagination.total > 0 && renderPagination()}
    </div>
  );
};

export default NotesList;