import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import { useAuth } from '../utils/AuthContext'; 
import { ChevronLeftIcon, ChevronRightIcon, UserCircleIcon, FunnelIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import WalletConnect from '../components/WalletConnect';
import { shortener } from '../utils/utils';

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [notes, setNotes] = useState([]);
  const [notesStats, setNotesStats] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotes, setTotalNotes] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchProfileData = async () => {
      if (authLoading) return; // Wait until authentication status is loaded
      
      setIsLoadingProfile(true);
      try {
        const token = getCookie('authToken');
        
        // Fetch profile data with authentication header
        const profileResponse = await axios.get(`${API_CONFIG.baseUrl}profil`, { 
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          validateStatus: (status) => true // Handle error statuses ourselves
        });
        
        if (profileResponse.status === 200) {
          setProfileData(profileResponse.data);
          setError(null);
        } else if (profileResponse.status === 403) {
          setError("Unauthorized access. Please log in to view your profile.");
          setProfileData(null);
        } else {
          setError(`Error ${profileResponse.status}: ${profileResponse.data.message || 'Unable to load profile data'}`);
          setProfileData(null);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setError("An error occurred while communicating with the server.");
        setProfileData(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    
    fetchProfileData();
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    const fetchUserNotes = async () => {
      if (!profileData?.stakeKey || authLoading) return;
      
      setIsLoadingNotes(true);
      try {
        const token = getCookie('authToken');
        
        // Prepare params with optional status filter
        const params = { 
          page: currentPage, 
          limit: 10 
        };
        
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }
        
        // Fetch notes for the authenticated user
        const notesResponse = await axios.get(
          `${API_CONFIG.baseUrl}api/authors/${profileData.stakeKey}/notes`, 
          {
            params,
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            }
          }
        );
        
        // Fetch note statistics
        const statsResponse = await axios.get(
          `${API_CONFIG.baseUrl}api/authors/${profileData.stakeKey}/count`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            }
          }
        );
        
        setNotes(notesResponse.data.notes);
        setTotalPages(notesResponse.data.pagination.pages);
        setTotalNotes(notesResponse.data.pagination.total);
        setNotesStats(statsResponse.data);
        
      } catch (error) {
        console.error("Error fetching user notes:", error);
        setError("Failed to load notes. Please try again later.");
      } finally {
        setIsLoadingNotes(false);
      }
    };
    
    fetchUserNotes();
  }, [profileData, currentPage, authLoading, statusFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const renderPagination = () => {
    if (totalNotes === 0) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between my-6 gap-4">
        <div className="text-sm text-base-content">
          Showing {(currentPage - 1) * 10 + 1} to{' '}
          {Math.min(currentPage * 10, totalNotes)} of {totalNotes} notes
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoadingNotes}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoadingNotes}
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
      <select 
        value={statusFilter} 
        onChange={(e) => handleStatusFilterChange(e.target.value)}
        className="select select-bordered bg-option-bg text-option-text select-sm rounded-lg"
      >
        <option value="all">All notes</option>
        <option value="approved">Approved</option>
        <option value="pending">Pending</option>
        <option value="rejected">Rejected</option>
      </select>
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

  // Display while authentication is loading
  if (authLoading || isLoadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-40">
        <span className="loading loading-spinner loading-md text-primary"></span>
      </div>
    );
  }
  
  // Display if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="card shadow-xl p-6 text-center text-base-content">
        <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
        <p className="mb-4">Please connect your wallet to view your profile</p>
        <WalletConnect />
      </div>
    );
  }

  // Display if there's an error
  if (error) {
    return <div className="text-center py-4 text-error">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto py-6 text-base-content max-w-lgx2">
      <h2 className="text-xl font-bold mb-4">My Profile</h2>
      
      {/* User info card */}
      <div className="mb-8">
        <div className="mx-auto">
          <h3 className="card-title mx-auto justify-center w-auto">
            <UserCircleIcon className="h-6 w-6 text-primary mr-2" />{shortener(profileData.stakeKey)}
          </h3>
        </div>
      </div>

      {/* Notes Statistics Card */}
      {notesStats ? (
        <div className="stats stats-vertical lg:stats-horizontal shadow-xl mb-8 w-full max-w-2xl">
          <div className="stat">
            <div className="stat-title">Total Notes</div>
            <div className="stat-value">{notesStats.total}</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Pending</div>
            <div className="stat-value text-warning">{notesStats.byStatus.pending}</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Approved</div>
            <div className="stat-value text-success">{notesStats.byStatus.approved}</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Rejected</div>
            <div className="stat-value text-error">{notesStats.byStatus.rejected}</div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>No statistics available</span>
        </div>
      )}

      {/* Notes List Section */}
      <h2 className="text-xl font-bold mb-4">My Notes</h2>
      
      {/* Status filter dropdown */}
      {renderStatusFilter()}
      
      {/* Top pagination */}
      {renderPagination()}
      
      {isLoadingNotes ? (
        <div className="flex justify-center items-center min-h-40">
          <span className="loading loading-spinner loading-md text-primary"></span>
        </div>
      ) : notes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Target Wallet</th>
                <th>Content</th>
                <th>Status</th>
                <th>Date</th>
                <th>Score</th>
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
                  <td>{new Date(note.createdAt).toLocaleDateString()}</td>
                  <td>{note.score}</td>
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

export default ProfilePage;