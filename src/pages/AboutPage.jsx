import React, { useState, useEffect } from 'react';


const AboutPage = () => {
  return (
    <>
      <div className="text-base-content max-w-lg mx-auto text-left p-6">
        <h2 className="text-xl mb-3">About</h2>
        <p>We are proud to share with you our work ( in progress ). Feel free to feedback, use, share, improve.</p>
        <h2 className="text-xl mb-3 mt-14 ">WIP</h2>
        <p> Some features may not work, may work poorly, or have interface bugs. There’s still work to be done.
        </p>
        <h2 className="text-xl mt-14">Integrations</h2>
          <p>Orcfax ( prices from public feed )</p>
          <p>AdaHandle ( may not work properly )</p>
          <p>Rosen bridge</p>
          <p>INDY Staking ( for wallet historic charts)</p>
        <h2 className="text-xl mt-14">Team</h2>
         <p>Barbedouce</p>
         <p>Full list not disclosed yet.</p>
      </div>
    </>
  );
};

export default AboutPage;