import axios from 'axios';

export const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    console.log('Copied to clipboard!');
  });
};

export const getColorForAddress = (address) => {
  // Génère une couleur unique basée sur l'adresse
  return '#' + address.slice(0, 6).split('').map(char => char.charCodeAt(0).toString(16)).join('');
};

export const convertLovelaceToAda = (lovelace) => {
  return (parseInt(lovelace) / 1_000_000).toFixed(2) + '';
};

export const addSpaces = (number) => {
  if (number === null || number === undefined || isNaN(number)) return '0';
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export const shortener = (input) => {
  if (!input || typeof input !== 'string' || input.length <= 20) {
    return input || ''; // Retourne l'input tel quel s'il est trop court ou invalide
  }
  return `${input.slice(0, 10)}...${input.slice(-10)}`;
};


export const deviseResolver = async (unit) => {
  try {
      const response = await axios.get(`https://tokens.cardano.org/metadata/${unit}`);
      const metadata = response.data;
      if (metadata && metadata.ticker && metadata.ticker.value) {
        return metadata.ticker.value;
      }
    // If it's not a special case or if we couldn't fetch the ticker, return the unit as is
    return unit;
  } catch (error) {
    console.error('Error resolving devise:', error);
    // In case of an error, return the original unit
    return unit;
  }
};