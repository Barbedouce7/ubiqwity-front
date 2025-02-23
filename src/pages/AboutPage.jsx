import React, { useState, useEffect } from 'react';
import WalletConnect from '../components/WalletConnect';


const AboutPage = () => {
  return (
    <>
      <div className="text-base-content max-w-lg mx-auto mt-20 text-left">
            {/*<WalletConnect />*/}

        <h2 className="text-xl mb-3">About</h2>
        <p>  Some features may not work, may work poorly, or have interface bugs. There’s still work to be done.
        </p>
        <h2 className="text-xl mt-14">Integrations</h2>
        <p><img src="/assets/orcfax.svg" className="w-24" />
          Prices from Orcfax public feed.</p>
          <p>AdaHandle</p>
      </div>
    </>
  );
};

export default AboutPage;