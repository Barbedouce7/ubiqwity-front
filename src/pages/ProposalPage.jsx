import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import { useParams, Link } from 'react-router-dom';
import CopyButton from '../components/CopyButton';
import Pagination from '../components/Pagination';
import { shortener, convertLovelaceToAda } from '../utils/utils';
import { 
  GlobeAltIcon, 
  XMarkIcon, 
  PlayCircleIcon, 
  CodeBracketIcon, 
  ChatBubbleLeftRightIcon 
} from '@heroicons/react/24/solid';

function getReferenceIcon(uri) {
  if (typeof uri !== 'string' || !uri) return <GlobeAltIcon className="h-5 w-5" />;
  const lowercaseUri = uri.toLowerCase();
  if (lowercaseUri.includes('x.com') || lowercaseUri.includes('twitter.com')) return <XMarkIcon className="h-5 w-5" />;
  if (lowercaseUri.includes('youtube.com') || lowercaseUri.includes('youtu.be')) return <PlayCircleIcon className="h-5 w-5" />;
  if (lowercaseUri.includes('github.com')) return <CodeBracketIcon className="h-5 w-5" />;
  if (lowercaseUri.includes('discord.com') || lowercaseUri.includes('discord.gg')) return <ChatBubbleLeftRightIcon className="h-5 w-5" />;
  return <GlobeAltIcon className="h-5 w-5" />;
}

const getValue = (field) => {
  if (field && typeof field === 'object' && '@value' in field) return field['@value'];
  return typeof field === 'string' ? field : '';
};

function ProposalPage() {
  const { txHash, certIndex } = useParams();
  const [data, setData] = useState(null);
  const [votes, setVotes] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loadingProposal, setLoadingProposal] = useState(true); // Chargement de la proposition
  const [loadingVotes, setLoadingVotes] = useState(false);     // Chargement des votes
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('metadata');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [theme, setTheme] = useState('light');

  const detectTheme = useCallback(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      return document.documentElement.classList.contains("dark") || 
             document.documentElement.classList.contains("vibrant") 
             ? "dark" 
             : "light";
    }
    return "light";
  }, []);

  useEffect(() => {
    const initialTheme = detectTheme();
    setTheme(initialTheme);
    const observer = new MutationObserver(() => setTheme(detectTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [detectTheme]);

  // Chargement des données de la proposition (ne dépend que de txHash et certIndex)
  useEffect(() => {
    const fetchProposalData = async () => {
      try {
        setLoadingProposal(true);
        const proposalResponse = await axios.get(`${API_CONFIG.baseUrl}proposals/${txHash}/${certIndex}`);
        if (proposalResponse.data.status !== 'success') throw new Error(proposalResponse.data.message || 'Failed to load proposal');
        setData(proposalResponse.data.data);
      } catch (err) {
        setError(`Error loading Proposal data: ${err.message}`);
        console.error('Error loading Proposal data:', err);
      } finally {
        setLoadingProposal(false);
      }
    };
    fetchProposalData();
  }, [txHash, certIndex]);

  // Chargement des votes (dépend de currentPage, txHash et certIndex)
  useEffect(() => {
    const fetchVotesData = async () => {
      try {
        setLoadingVotes(true);
        const votesResponse = await axios.get(`${API_CONFIG.baseUrl}proposals/${txHash}/${certIndex}/votes`, {
          params: { page: currentPage, limit: itemsPerPage }
        });
        if (votesResponse.data.status !== 'success') throw new Error(votesResponse.data.message || 'Failed to load votes');
        setVotes(votesResponse.data.data);
        setTotalVotes(votesResponse.data.pagination.total);
      } catch (err) {
        setError(`Error loading Votes data: ${err.message}`);
        console.error('Error loading Votes data:', err);
      } finally {
        setLoadingVotes(false);
      }
    };
    fetchVotesData();
  }, [txHash, certIndex, currentPage]);

  const renderMetadata = () => {
    if (!data || !data.metadata || !data.metadata.body) {
      return <p className="text-base-content">No metadata available for this Proposal.</p>;
    }

    const { title, abstract, rationale, motivation, references } = data.metadata.body;

    return (
      <div className="rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {title && getValue(title) && (
            <div className="mb-4 p-4">
              <p className="text-lg font-semibold">Title</p>
              <p>{getValue(title)}</p>
            </div>
          )}
          {abstract && getValue(abstract) && (
            <div className="mb-4 p-4">
              <p className="text-lg font-semibold">Abstract</p>
              <p>{getValue(abstract)}</p>
            </div>
          )}
          {rationale && getValue(rationale) && (
            <div className="mb-4 p-4">
              <p className="text-lg font-semibold">Rationale</p>
              <p>{getValue(rationale)}</p>
            </div>
          )}
          {motivation && getValue(motivation) && (
            <div className="mb-4 p-4">
              <p className="text-lg font-semibold">Motivation</p>
              <p>{getValue(motivation)}</p>
            </div>
          )}
          {references && references.length > 0 && (
            <div className="mb-4 p-4">
              <p className="text-lg font-semibold">References</p>
              <div className="flex flex-col gap-2 mt-2">
                {references.map((ref, index) => {
                  const uriValue = getValue(ref.uri);
                  return uriValue ? (
                    <div key={index} className="flex items-center gap-2">
                      <a href={uriValue} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-cyan-100">
                        {getReferenceIcon(uriValue)}
                      </a>
                      <a href={uriValue} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-cyan-100 text-sm truncate">
                        {uriValue}
                      </a>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderVotes = () => {
    const totalPages = Math.ceil(totalVotes / itemsPerPage);

    return (
      <div className="rounded-lg">
        <h2 className="text-xl font-semibold text-primary mb-4">DRep Votes</h2>
        {loadingVotes ? (
          <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mb-4"></div>
        ) : votes.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <div className="max-h-[70vh] overflow-y-auto border border-gray-300 rounded-lg">
                <table className="min-w-full border-collapse">
                  <thead className="bg-base-100">
                    <tr className="border-b border-gray-300">
                      <th className="p-4 text-left sticky top-0 bg-base-100 z-10 border-r border-gray-300">DRep</th>
                      <th className="p-4 text-center sticky top-0 bg-base-100 z-10">Vote</th>
                    </tr>
                  </thead>
                  <tbody>
                    {votes.map((vote, index) => (
                      <tr key={index} className="border-t border-gray-300">
                        <td className="p-4 border-r border-gray-300">
                          <div className="flex flex-col gap-1">
                            {vote.drep_name && vote.drep_name !== "null" && (
                              <Link
                                to={`/drep/${vote.voter}`}
                                className="text-primary hover:text-cyan-100 text-sm"
                              >
                                {vote.drep_name}
                              </Link>
                            )}
                            <div className="flex items-center justify-center gap-2">
                              <CopyButton text={vote.voter} />
                              <Link
                                to={`/drep/${vote.voter}`}
                                className="text-primary hover:text-cyan-100 text-sm"
                              >
                                {shortener(vote.voter)}
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded border border-gray-300 text-black ${
                              vote.vote === 'yes' ? 'bg-green-400' :
                              vote.vote === 'no' ? 'bg-red-400' :
                              'bg-yellow-400'
                            }`}
                          >
                            {vote.vote.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
              itemsPerPage={itemsPerPage} 
              totalItems={totalVotes} 
            />
          </>
        ) : (
          <p className="text-base-content">No DRep votes found for this Proposal on this page.</p>
        )}
      </div>
    );
  };

  if (loadingProposal) return <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40 mb-40"></div>;
  if (error) return <div className="text-red-500 text-center mt-40">{error}</div>;
  if (!data) return <div className="text-center mt-40">No proposal data available.</div>;

  const depositInAda = data.deposit ? convertLovelaceToAda(data.deposit) : "0";
  const proposalTitle = getValue(data.metadata?.body?.title) || 'Untitled Proposal';

  return (
    <div className="container mx-auto p-4 text-base-content">
      <h1 className="text-3xl font-bold text-center text-sky-500 mb-6">Proposal: {proposalTitle}</h1>
      <div className="text-center mb-6 mt-6">
        <p className="text-lg">
          Transaction Hash: <CopyButton text={data.tx_hash} />
          <span className="font-bold text-sky-500">{shortener(data.tx_hash)}</span>
        </p>
        <p className="text-lg">Cert Index: <span className="font-bold text-sky-500">{data.cert_index}</span></p>
        <p className="text-lg">Governance Type: <span className="font-bold text-sky-500">{data.governance_type || 'N/A'}</span></p>
        <p className="text-lg">Deposit: <span className="font-bold">{depositInAda} ₳</span></p>
        <p className="text-lg">Return Address: 
          <CopyButton text={data.return_address} />
          <Link className="font-bold text-sky-500 hover:text-cyan-100" to={`/wallet/${data.return_address}`}>
            {shortener(data.return_address)}
          </Link>
        </p>
        <p className="text-lg">Enacted Epoch: <span className="font-bold">{data.enacted_epoch || 'N/A'}</span></p>
        <p className="text-lg">Expired Epoch: <span className="font-bold">{data.expired_epoch || 'N/A'}</span></p>
        <p className="text-lg">Expiration: <span className="font-bold">{data.expiration || 'N/A'}</span></p>
      </div>

      <div className="tabs mt-6 mb-6 flex justify-center items-center relative">
        <div className="tabs">
          <a className={`tab-custom ${activeTab === 'metadata' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('metadata')}>Metadata</a>
          <a className={`tab-custom ${activeTab === 'votes' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('votes')}>DRep Votes</a>
        </div>
      </div>

      {activeTab === 'metadata' && renderMetadata()}
      {activeTab === 'votes' && renderVotes()}
    </div>
  );
}

export default ProposalPage;