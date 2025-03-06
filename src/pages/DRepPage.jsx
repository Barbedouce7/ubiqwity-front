import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import { TokenContext } from '../utils/TokenContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import CopyButton from '../components/CopyButton';
import Pagination from '../components/Pagination';
import { shortener } from '../utils/utils';
import { FormatNumberWithSpaces } from '../utils/FormatNumberWithSpaces';
import { GlobeAltIcon } from '@heroicons/react/24/solid';

// Import pour le graphique
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bubble } from "react-chartjs-2";

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Fonctions utilitaires pour le graphique
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

function DRepPage() {
  const { drepId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [delegators, setDelegators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('metadata');
  const { tokenMetadata, fetchTokenData } = useContext(TokenContext);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [delegatorColors, setDelegatorColors] = useState({});
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const drepResponse = await axios.get(`${API_CONFIG.baseUrl}drep/${drepId}`);
        setData(drepResponse.data);
        const delegatorsResponse = await axios.get(`${API_CONFIG.baseUrl}drepdelegators/${drepId}`);
        // Tri initial par montant décroissant
        const sortedDelegators = delegatorsResponse.data.sort((a, b) => 
          Number(b.amount) - Number(a.amount)
        );
        setDelegators(sortedDelegators);
        setDelegatorColors(generateDelegatorColors(sortedDelegators));
      } catch (err) {
        setError('Error loading DRep data');
        console.error('Error loading DRep data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [drepId]);

  useEffect(() => {
    const detectTheme = () => {
      if (document.documentElement.classList.contains("dark")) {
        setTheme("dark");
      } else {
        setTheme("light");
      }
    };

    detectTheme();
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const renderDelegators = () => {
    const totalAmount = delegators.reduce((sum, delegator) => {
      return sum + BigInt(delegator.amount);
    }, BigInt(0));
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
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Amount (₳)',
            color: textColor
          },
          ticks: { color: textColor },
          grid: { color: gridColor }
        },
        x: {
          title: {
            display: true,
            text: 'Delegators',
            color: textColor
          },
          ticks: {
            color: textColor,
            callback: function(value) {
              return shortener(delegators[value]?.address || '');
            }
          },
          grid: { color: gridColor }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: textColor,
          bodyColor: textColor,
          callbacks: {
            label: function(context) {
              const index = context.dataIndex;
              const delegator = delegators[index];
              return [
                `Address: ${shortener(delegator.address)}`,
                `Amount: ${(Number(delegator.amount) / 1000000).toFixed(2)} ₳`
              ];
            }
          }
        }
      },
      maintainAspectRatio: false,
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const address = delegators[index].address;
          navigate(`/wallet/${address}`);
        }
      },
      onHover: (event, chartElements) => {
        event.native.target.style.cursor = chartElements.length ? 'pointer' : 'default';
      }
    };

    return (
      <div className="bg-base-400 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-primary mb-4">Delegators</h2>
        <p className="mb-4">Total Amount Delegated: <span className="font-bold text-sky-500">{formattedTotalAmount} ₳</span></p>

        {delegators.length > 0 ? (
          <>
            <div className="w-full mb-8" style={{ height: '400px' }}>
              <Bubble data={chartData} options={chartOptions} />
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
            />

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Amount (₳)</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDelegators.map((delegator, index) => {
                    const formattedAmount = (Number(delegator.amount) / 1000000).toFixed(2);
                    return (
                      <tr key={index}>
                        <td>
                          <CopyButton text={delegator.address} />
                          <Link 
                            className="text-primary hover:text-cyan-100" 
                            to={`/wallet/${delegator.address}`}
                            style={{ color: delegatorColors[delegator.address] }}
                          >
                            {shortener(delegator.address)}
                          </Link>
                        </td>
                        <td>{formattedAmount} ₳</td>
                      </tr>
                    );
                  })}
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
          <p className="text-base-content">No delegators found for this DRep.</p>
        )}
      </div>
    );
  };

  const renderMetadata = () => {
    if (!data || !data.metadata || !data.metadata.json_metadata) {
      return <p className="text-base-content">No metadata available for this DRep.</p>;
    }

    const metadata = data.metadata.json_metadata;
    const body = metadata.body || {};

    return (
      <div className="bg-base-400 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-primary mb-4">DRep Metadata</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {body.givenName && (
            <div className="mb-4 rounded-lg bg-base-100 p-4 shadow-xl">
              <p className="text-lg font-semibold">Name</p>
              <p>{body.givenName}</p>
            </div>
          )}
          {body.paymentAddress && (
            <div className="mb-4 rounded-lg bg-base-100 p-4 shadow-xl">
              <p className="text-lg font-semibold">Payment Address</p>
              <p className="break-all">
                <CopyButton text={body.paymentAddress} />
                <Link className="text-primary hover:text-cyan-100" to={`/wallet/${body.paymentAddress}`}>
                  {shortener(body.paymentAddress)}
                </Link>
              </p>
            </div>
          )}
        </div>
        {body.objectives && (
          <div className="mb-4 rounded-lg bg-base-100 p-4 shadow-xl">
            <p className="text-lg font-semibold">Objectives</p>
            <p>{body.objectives}</p>
          </div>
        )}
        {body.motivations && (
          <div className="mb-4 rounded-lg bg-base-100 p-4 shadow-xl">
            <p className="text-lg font-semibold">Motivations</p>
            <p>{body.motivations}</p>
          </div>
        )}
        {body.qualifications && (
          <div className="mb-4 rounded-lg bg-base-100 p-4 shadow-xl">
            <p className="text-lg font-semibold">Qualifications</p>
            <p>{body.qualifications}</p>
          </div>
        )}
        {body.references && body.references.length > 0 && (
          <div className="mb-4 rounded-lg bg-base-100 p-4 shadow-xl">
            <p className="text-lg font-semibold">References</p>
            <ul className="list-disc pl-5 mt-2">
              {body.references.map((ref, index) => (
                <li key={index}>
                  <a 
                    href={ref.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-cyan-100"
                  >
                    {ref.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40 mb-40"></div>;
  if (error) return <div>{error}</div>;

  const amountInAda = data?.amount ? (Number(data.amount) / 1000000).toFixed(2) : "0";
  const drepName = data?.metadata?.json_metadata?.body?.givenName || 'Unnamed DRep';

  return (
    <div className="container mx-auto p-6 text-base-content">
      <h1 className="text-3xl font-bold text-center text-sky-500 mb-6">DRep Details - {drepName}</h1>

      <div className="text-center mb-6 mt-6">
        <p className="text-lg">DRep ID: <CopyButton text={data.drep_id} /><span className="font-bold text-sky-500">{shortener(data.drep_id)}</span></p>
        <p className="text-lg">Hex: <CopyButton text={data.hex} /><span className="font-bold text-sky-500">{shortener(data.hex)}</span></p>
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
          <a className={`tab-custom ${activeTab === 'delegators' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('delegators')}>Delegators</a>
          <a className={`tab-custom ${activeTab === 'json' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('json')}>JSON</a>
        </div>
      </div>

      {activeTab === 'metadata' && renderMetadata()}
      {activeTab === 'delegators' && renderDelegators()}
      {activeTab === 'json' && (
        <pre className="p-4 rounded-lg overflow-auto text-left bg-base-100 text-base-content shadow-xl">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default DRepPage;