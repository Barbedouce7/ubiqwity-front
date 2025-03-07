import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import { TokenContext } from '../utils/TokenContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import CopyButton from '../components/CopyButton';
import Pagination from '../components/Pagination';
import { shortener } from '../utils/utils';
import { 
  GlobeAltIcon, 
  XMarkIcon, 
  PlayCircleIcon, 
  CodeBracketIcon, 
  ChatBubbleLeftRightIcon 
} from '@heroicons/react/24/solid';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from "chart.js";
import { Bubble } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const generateRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsla(${hue}, 70%, 50%, 0.7)`;
};

const generateDelegatorColors = (delegators) => {
  return delegators.reduce((acc, delegator) => {
    acc[delegator.address] = generateRandomColor();
    return acc;
  }, {});
};

function getReferenceIcon(uri) {
  if (typeof uri !== 'string' || !uri) {
    return <GlobeAltIcon className="h-5 w-5" />;
  }

  const lowercaseUri = uri.toLowerCase();
  if (lowercaseUri.includes('x.com') || lowercaseUri.includes('twitter.com')) {
    return <XMarkIcon className="h-5 w-5" />;
  } else if (lowercaseUri.includes('youtube.com') || lowercaseUri.includes('youtu.be')) {
    return <PlayCircleIcon className="h-5 w-5" />;
  } else if (lowercaseUri.includes('github.com')) {
    return <CodeBracketIcon className="h-5 w-5" />;
  } else if (lowercaseUri.includes('discord.com') || lowercaseUri.includes('discord.gg')) {
    return <ChatBubbleLeftRightIcon className="h-5 w-5" />;
  } else {
    return <GlobeAltIcon className="h-5 w-5" />;
  }
}

const getValue = (field) => {
  if (field && typeof field === 'object' && '@value' in field) {
    return field['@value'];
  }
  return typeof field === 'string' ? field : '';
};

function DRepPage() {
  const { drepId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [delegators, setDelegators] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('metadata');
  const { tokenMetadata, fetchTokenData } = useContext(TokenContext);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [delegatorColors, setDelegatorColors] = useState({});
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

    const observer = new MutationObserver(() => {
      const newTheme = detectTheme();
      setTheme(newTheme);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [detectTheme]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const drepResponse = await axios.get(`${API_CONFIG.baseUrl}drep/${drepId}`);
        setData(drepResponse.data);

        if (!drepId.includes('_')) {
          const delegatorsResponse = await axios.get(`${API_CONFIG.baseUrl}drepdelegators/${drepId}`);
          const sortedDelegators = delegatorsResponse.data.sort((a, b) => 
            Number(b.amount) - Number(a.amount)
          );
          setDelegators(sortedDelegators);
          setDelegatorColors(generateDelegatorColors(sortedDelegators));

          const votesResponse = await axios.get(`${API_CONFIG.baseUrl}drepvotes/${drepId}`);
          setVotes(votesResponse.data);
        }
      } catch (err) {
        setError('Error loading DRep data');
        console.error('Error loading DRep data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [drepId]);

  const renderDelegators = () => {
    if (drepId.includes('_')) return null;

    const totalAmount = delegators.reduce((sum, delegator) => sum + BigInt(delegator.amount), BigInt(0));
    const formattedTotalAmount = (Number(totalAmount) / 1000000).toFixed(2);
    const totalItems = delegators.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentDelegators = delegators.slice(startIndex, endIndex);

    const textColor = theme === "dark" ? "#ffffff" : "#000000";
    const gridColor = theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
    const tooltipBg = theme === "dark" ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)";
    const maxAmount = Math.max(...delegators.map(d => Number(d.amount) / 1000000), 1);

    const chartData = {
      datasets: [{
        data: delegators.map((delegator, index) => ({
          x: index,
          y: Number(delegator.amount) / 1000000,
          r: (Number(delegator.amount) / 1000000 / maxAmount) * 20 + 5
        })),
        backgroundColor: delegators.map(delegator => delegatorColors[delegator.address]),
        borderColor: 'transparent',
        hoverBackgroundColor: delegators.map(delegator => 
          delegatorColors[delegator.address].replace('0.7', '1')
        ),
      }]
    };

    const chartOptions = {
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Amount (₳)', color: textColor }, ticks: { color: textColor }, grid: { color: gridColor } },
        x: { title: { display: true, text: 'Delegators', color: textColor }, ticks: { color: textColor, callback: (value) => shortener(delegators[value]?.address || '') }, grid: { color: gridColor } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: textColor,
          bodyColor: textColor,
          callbacks: {
            label: (context) => {
              const index = context.dataIndex;
              const delegator = delegators[index];
              return [`Address: ${shortener(delegator.address)}`, `Amount: ${(Number(delegator.amount) / 1000000).toFixed(2)} ₳`];
            }
          }
        }
      },
      maintainAspectRatio: false,
      onClick: (event, elements) => elements.length > 0 && navigate(`/wallet/${delegators[elements[0].index].address}`),
      onHover: (event, chartElements) => { event.native.target.style.cursor = chartElements.length ? 'pointer' : 'default'; }
    };

    return (
      <div className="bg-base-400 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-primary mb-4">Delegators</h2>
        <p className="mb-4">Total Amount Delegated: <span className="font-bold text-sky-500">{formattedTotalAmount} ₳</span></p>
        {delegators.length > 0 ? (
          <>
            <div className="w-full mb-8" style={{ height: '400px' }}><Bubble data={chartData} options={chartOptions} /></div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} totalItems={totalItems} />
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead><tr><th>Address</th><th>Amount (₳)</th></tr></thead>
                <tbody>
                  {currentDelegators.map((delegator, index) => (
                    <tr key={index}>
                      <td><CopyButton text={delegator.address} /><Link className="text-primary hover:text-cyan-100" to={`/wallet/${delegator.address}`} style={{ color: delegatorColors[delegator.address] }}>{shortener(delegator.address)}</Link></td>
                      <td>{(Number(delegator.amount) / 1000000).toFixed(2)} ₳</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} totalItems={totalItems} />
          </>
        ) : <p className="text-base-content">No delegators found for this DRep.</p>}
      </div>
    );
  };

  const renderMetadata = () => {
    if (!data || !data.metadata || !data.metadata.body) {
      return <p className="text-base-content">No metadata available for this DRep.</p>;
    }

    const { objectives, motivations, qualifications, references } = data.metadata.body;

    return (
      <div className="bg-base-400 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {objectives && getValue(objectives) && (
            <div className="mb-4 rounded-lg bg-base-100 p-4 shadow-xl">
              <p className="text-lg font-semibold">Objectives</p>
              <p>{getValue(objectives)}</p>
            </div>
          )}
          {motivations && getValue(motivations) && (
            <div className="mb-4 rounded-lg bg-base-100 p-4 shadow-xl">
              <p className="text-lg font-semibold">Motivations</p>
              <p>{getValue(motivations)}</p>
            </div>
          )}
          {qualifications && getValue(qualifications) && (
            <div className="mb-4 rounded-lg bg-base-100 p-4 shadow-xl">
              <p className="text-lg font-semibold">Qualifications</p>
              <p>{getValue(qualifications)}</p>
            </div>
          )}
          {references && references.length > 0 && (
            <div className="mb-4 rounded-lg bg-base-100 p-4 shadow-xl">
              <p className="text-lg font-semibold">References</p>
              <div className="flex flex-col gap-2 mt-2">
                {references.map((ref, index) => {
                  const uriValue = getValue(ref.uri);
                  return uriValue ? (
                    <div key={index} className="flex items-center gap-2">
                      <a
                        href={uriValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-cyan-100"
                      >
                        {getReferenceIcon(uriValue)}
                      </a>
                      <a
                        href={uriValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-cyan-100 text-sm truncate"
                      >
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
    if (drepId.includes('_')) return null;

    const totalItems = votes.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentVotes = votes.slice(startIndex, endIndex);

    return (
      <div className="bg-base-400 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-primary mb-4">Votes</h2>
        {votes.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="table table-compact w-full">
                <thead>
                  <tr>
                    <th className="text-sm py-2">Transaction Hash</th>
                    <th className="text-sm py-2">Cert Index</th>
                    <th className="text-sm py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {currentVotes.map((vote, index) => (
                    <tr key={index}>
                      <td className="py-1">
                        <CopyButton text={vote.tx_hash} />
                        <span className="text-primary hover:text-cyan-100 text-sm">{shortener(vote.tx_hash)}</span>
                      </td>
                      <td className="py-1 text-sm">{vote.cert_index}</td>
                      <td className="py-1">
                        <span className={`badge badge-sm ${
                          vote.vote === 'yes' ? 'badge-success' : 
                          vote.vote === 'no' ? 'badge-error' : 
                          'badge-warning'
                        }`}>
                          {vote.vote.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
              itemsPerPage={itemsPerPage} 
              totalItems={totalItems} 
            />
          </>
        ) : (
          <p className="text-base-content">No votes found for this DRep.</p>
        )}
      </div>
    );
  };

  if (loading) return <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40 mb-40"></div>;
  if (error) return <div>{error}</div>;

  const amountInAda = data?.amount ? (Number(data.amount) / 1000000).toFixed(2) : "0";
  const drepName = getValue(data?.metadata?.body?.givenName) || 'Unnamed';
  const paymentAddress = getValue(data?.metadata?.body?.paymentAddress);

  return (
    <div className="container mx-auto p-6 text-base-content">
      <h1 className="text-3xl font-bold text-center text-sky-500 mb-6">DRep: {drepName}</h1>
      <div className="text-center mb-6 mt-6">
        <p className="text-lg">DRep ID: <CopyButton text={data.drep_id} /><span className="font-bold text-sky-500">{shortener(data.drep_id)}</span></p>
        <p className="text-lg">Hex: <CopyButton text={data.hex} /><span className="font-bold text-sky-500">{shortener(data.hex)}</span></p>
        {paymentAddress && typeof paymentAddress === 'string' && paymentAddress.trim() !== '' && (
          <p className="text-lg">
            Payment Address: <CopyButton text={paymentAddress} />
            <Link className="font-bold text-sky-500 hover:text-cyan-100" to={`/wallet/${paymentAddress}`}>
              {shortener(paymentAddress)}
            </Link>
          </p>
        )}
        <p className="text-lg">Amount: <span className="font-bold">{amountInAda} ₳</span></p>
        <p className="text-lg">Status: 
          <span className={`font-bold ${data.active ? 'text-green-500' : 'text-red-500'}`}>
            {data.active ? ' Active' : ' Inactive'}
          </span>
          {data.retired && <span className="font-bold text-red-500"> (Retired)</span>}
          {data.expired && <span className="font-bold text-red-500"> (Expired)</span>}
        </p>
        <p className="text-lg">Active Epoch: <span className="font-bold">{data.active_epoch}</span></p>
        <p className="text-lg">Last Active Epoch: <span className="font-bold">{data.last_active_epoch}</span></p>
        <p className="text-lg">Has Script: <span className="font-bold">{data.has_script ? 'Yes' : 'No'}</span></p>
      </div>

      <div className="tabs mt-6 mb-6 flex justify-center items-center relative">
        <div className="tabs">
          <a className={`tab-custom ${activeTab === 'metadata' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('metadata')}>Metadata</a>
          {!drepId.includes('_') && (
            <>
              <a className={`tab-custom ${activeTab === 'delegators' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('delegators')}>Delegators</a>
              <a className={`tab-custom ${activeTab === 'votes' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('votes')}>Votes</a>
            </>
          )}
        </div>
      </div>

      {activeTab === 'metadata' && renderMetadata()}
      {activeTab === 'delegators' && renderDelegators()}
      {activeTab === 'votes' && renderVotes()}
    </div>
  );
}

export default DRepPage;