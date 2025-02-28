import React, { useState, useEffect } from 'react';


const AboutPage = () => {
  return (
    <>
      <div className="text-base-content max-w-lg mx-auto text-left p-6">
        <h2 className="text-xl mb-3">About</h2>
        <p>  Some features may not work, may work poorly, or have interface bugs. There’s still work to be done.
        </p>
        <h2 className="text-xl mt-14">Integrations</h2>
          <p>Orcfax ( prices from public feed )</p>
          <p>AdaHandle ( May not work properly )</p>
          <p>Rosen bridge</p>
          <p>INDY Staking ( for wallet historc charts)</p>
      </div>
    </>
  );
};

export default AboutPage;