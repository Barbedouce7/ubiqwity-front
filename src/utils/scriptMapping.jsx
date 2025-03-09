const scriptMappings = {
  '918765cae1147f5f2d914d45059f8b6497caa149ea94dd8da1f683ce': 'Indigo SP',
  '54e8d424816f5bbd423353009ff7c31ada2cbdefe651175014117f46': 'Indigo staking',
  'fd0d72fafee1d230a74c31ac503a192abd5b71888ae3f94128c1e634': 'Indigo staking',
  'a23793f529179e09cefb3c37fc6ae081e0e99e99be5cdb55a00941a5': 'Indigo staking',
  '8110c6ae9c92962f01ce98611656c05ea69aa5a709f4ea89c588bbdb': 'Indigo staking',
  'a473cb8eb0b61c03b8696fceab1c1a89fa3ec834572850e7c2abe783': 'Indigo SP',
  'de1585e046f16fdf79767300233c1affbe9d30340656acfde45e9142': 'Indigo CDP',
  '443c51db609bba8b2aa4c8af248bf797cbfcfa1e413c443296a50813': 'Indigo SP',
  'c1af46643698bc73f9857a0cc21ec949ce6919974b435d057dc448b8': 'Indigo SP', // Indigo  pool ?
  'e4d2fb0b8d275852103fd75801e2c7dcf6ed3e276c74cabadbe5b8b6': 'Indigo CDP', // Indigo  cdp addflouz
  'ea5358d9fe82cc7ad8de0e76b4eabd851526408e51daa9d8bb4b137d': 'Indigo CDP', // Indigo  cdp creator
  '708f5e6d597fc038d09a738d7be32edd6ea779d6feb32a53668d9050': 'Indigo CDP', // Indigo  (CDP ? )poll manager
  'f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880': 'Indigo CDP', // Indigo  cdp
  '131f26cd99012663aa063d0ef86dc0ac039d1797d5e062768fb12e74': 'Indigo Poll', // Indigo  poll manager
  '16c0a490c721920096645c5594499b2cb1d4067566a9e85855b9326c': 'Indigo Poll', // Indigo  poll manager
  '31aaab10e57345a2ed5c37ca32c57b2d9dc6219d23b51c85919febe2': 'Indigo Poll', // Indigo  poll manager
  '0d8aee2011f769502cdc07273f7e118722ebf9c585f3fee061986b7b': 'Indigo CDP', // Indigo  close CDP (?)
  'd8fba96a5ebeeaee104a5b6c9e9265fff0ad7af8c64698c7364157f0': 'Indigo CDP', // Indigo  CDP
  '0752abd65a0c983bfb1c9c3880cc632c099ba3adb2fe307afb4bbd9c': 'Indigo CDP', // Indigo  CDP (creation?)
  '9a5c575d3bf99604bcb691d5f000b4b41866edb893b35a718be5dd01': 'Indigo CDP', // Indigo  CDP (creation?)
  'ea184d0a7e640c4b5daa3f2cef851e75477729c2fd89f6ffbed7874c': 'Muesli', // Orderbook Contract
  '15b95fdaceeb507073a1bd198803373beeafbd82560fbf8abe9073ff': 'Muesli', // orderbook contract
  'f1ec90d33208778214cdc7fa90858ac5620253d99f84c10335928cab': 'Muesli', // orderbook contract
  'fea3f75281aa7f3f9f1a488030006cecd96290e9d3e7921a6b10c903': 'Muesli', // orderbook contract
  '00fb107bfbd51b3a5638867d3688e986ba38ff34fb738f5bd42b20d5': 'Muesli', // orderbook contract
  'e8baad9288dc9abdc099b46f2ac006b1a82c7df4996e067f00c04e8d': 'Muesli', // AMM pool contract
  '1b3c5a646a018e0cfbd40fba97518c8e955e5869f0afd4f8c568493e': 'Muesli', // Deposit contract
  '73ede893f547edbd25da6953fda33caacd01f44047922bf7c5ceb951': 'Muesli', // deposit contract
  '4136eeede1a49030451ee3a09d900959bafeafd9b536e59345ac780f': 'Muesli', // Muesli Concentrated liquidity pool contract
  'fc8fbdf64f25e04ec78052aa1a997b93867608951608fd74ca2fa83b': 'Muesli', // concentrated liquidity deposit contract
  '0454355b392202e594ce74be2f5ff9ae64c6ac0fbb45cb676f8078a2': 'Muesli', // Vault Contract
  '7045237d1eb0199c84dffe58fe6df7dc5d255eb4d418e4146d5721f8': 'Muesli', // Muesli AMM pool contract
  '0faa4f20b9d810205f89b42896e693ffc89c3ee4e307f4f0a4893e13': 'Liqwid',
  'a04ce7a52545e5e33c2867e148898d9e667a69602285f6a1298f9d68': 'Liqwid',
  '6df63e2fdde8b2c3b3396265b0cc824aa4fb999396b1c154280f6b0c': 'Liqwid',
  '800ca266a8f29a834dc8c4a9bc507cb3d9f4cd078934ddcc8ff97823': 'Liqwid',
  'da11a50969a7f77225a9e9e2c86e43d391a69dd47f339a4fd830d165': 'Liqwid',
  'fa3603d2283e3dadee0b5810faf590ea9da6c7fea91095657f98a9c2': 'Liqwid',
  '4811377ea9279acb8fff1d65a225e19c0eca68bb5c1d836a47584e67': 'Liqwid', // Liqwid Finance (WMT Action)
  '187314a316d8584705690ff0e8f6d0e5fe0af7c2a1d0b997579bb45c': 'Liqwid', // Liqwid Finance (USDT Action)
  '31415bb210164cf6b84d1b12537f0792d2912d156e0f1ed1d91c83ce': 'Liqwid', // Liqwid Finance (Ada markets action)
  '469772d2f93d70f92a4930fa608457392e58e480babf723ade7f9857': 'Liqwid', // Liqwid Finance (USDC Action)
  '02652a93b8327ba64b6c0bb8dfb11a76cbb333a3fbb4243ddc0859ac': 'Liqwid', // Liqwid Finance (MIN Action) 
  '26aea7e03a53e374c1d82c560a91b4147b8954d2ec4ecbd128e0c18c': 'Liqwid', // Liqwid Finance (Agora validators proposal)
  '2025463437ee5d64e89814a66ce7f98cb184a66ae85a2fbbfd750106': 'Splash',
  '3f462bf2453b153c876783601af26259d0f0f25b2c66510eca0b654b': 'Splash',
  'f002facfd69d51b63e7046c6d40349b0b17c8dd775ee415c66af3ccc': 'Splash',
  '2618e94cdb06792f05ae9b1ec78b0231f4b7f4215b1b4cf52e6342de': 'Splash', // Spectrum Finance swap order Script
  '6b9c456aa650cb808a9ab54326e039d5235ed69f069c9664a8fe5b69': 'Splash', // Spectrum Finance (liquidity pool)
  'e628bfd68c07a7a38fcd7d8df650812a9dfdbee54b1ed4c25c87ffbf': 'Splash', // Spectrum Finance (liquidity pool) "AMM pool contract"
  '83da79f531c19f9ce4d85359f56968a742cf05cc25ed3ca48c302dee': 'Splash', // Redeem order contract
  '075e09eb0fa89e1dc34691b3c56a7f437e60ac5ea67b338f2e176e20': 'Splash', // Spectrum Finance (deposit) Script "deposit order contract"
  'c727443d77df6cff95dca383994f4c3024d03ff56b02ecc22b0f3f65': 'JPGstore', // JPG store V1 Ask
  '9068a7a3f008803edac87af1619860f2cdcde40c26987325ace138ad': 'JPGstore', // jpg.store (OffersV2)
  'a55f409501bf65805bb0dc76f6f9ae90b61e19ed870bc00256813608': 'JPGstore', // JPG store V1
  '4a59ebd93ea53d1bbf7f82232c7b012700a0cf4bb78d879dabb1a20a': 'JPGstore',
  'a65ca58a4e9c755fa830173d2a5caed458ac0c73f97db7faae2e7e3b': 'Minswap', // Order Contract
  'e1317b152faac13426e6a83e06ff88a4d62cce3c1634ab0a5ec13309': 'Minswap', // pool contract
  '13aa2accf2e1561723aa26871e071fdf32c867cff7e7d50ad470d62f': 'Minswap', // "pool factory MP"
  'e4214b7cce62ac6fbba385d164df48e157eae5863521b4b67ca71d86': 'Minswap', // "LP token MP"
  '0be55d262b29f564998ff81efe21bdc0022621c12f15af08d0f2ddb1': 'Minswap', // "Pool NFT MP"
  '9b85d5e8611945505f078aeededcbed1d6ca11053f61e3f9d999fe44': 'Minswap Staking', // Staking Contract
  '98df3b00a1500fcb77daa0520550fb088fc923399788b89637b9de59': 'Minswap', // Harvest Contract
  '229863ae8694da16da002e889a1d19bcc82c581225b6dcca95fd69da': 'Minswap Staking', // Minswap (Min staking)
  '9df55104326a3264d803d44ed87139581d1c912e26ba8e73bc385e2f': 'Minswap', // "Mint staking contract"
  'a813c75283bac225b19f1d0c0a914d89cac6db9a9ce967d105d353ec': 'Minswap', // Vesting Contract
  'b15a1a010843e8afb6f963b03d452be815b533dad0cd23d819c2d201': 'Minswap', // Minswap (Yield Farming v2) = "staking contract"
  'f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c': 'Minswap', // V2 authen MInting policy
  '7bc5fbd41a95f561be84369631e0e35895efb0b73e0a7480bb9ed730': 'Minswap', // V2 factory contract
  'ea07b733d932129c378af627436e7cbc2ef0bf96e0036bb51b3bde6b': 'Minswap', // V2 pool contract
  'c3e28c36c3447315ba5a56f33da6a6ddc1770a876a8d9f0cb3a97c4c': 'Minswap', // V2 order contract
  '55ff0e63efa0694e8065122c552e80c7b51768b7f20917af25752a7c': 'Axo', // Axo (n/a) Script
  '605db7b5e5ba83f81fbf2c44e9750278c1af253db82e3df8639e3fb1': 'Axo', // Axo (n/a)
  '48b233fd4532c0c22831fd11df0f4b5e89e362d8abfc1ff22e596507': 'Axo', // Axo (n/a)
  'c8b1252870525ab48a7d90ef29132f252b8391db63565d08cceddb66': 'Axo', // Axo (n/a)
  '6b35255f5a768be1dd664d85529743e8632153b1a24621a7c20c9bea': 'Axo', // Axo
  '765fb5aeefdcd6a598ee998091c05d37241d4e6b761bd2a5032c2934': 'Axo', // Axo
  '8f2fee1e5be61e3d58368a7d10db6eba60543bbe63885d7754a47155': 'Axo', // Axo
  '03980eacc3ee8e551f12c05ccc76bba59a6fadef614fe269ebd10406': 'Axo', // Axo mm
  '9fd41da27127452544bb441905af003d6bc1ea1220eaa336d622121c': 'Axo', // Axo
  '0116b17c1f359bf0190cff4abf0ffc1adac8cc05288e0691f206a448': 'Axo',
  '66a6bfe25e7e73c6c27ebbc1d13dd18b74da6eab003762e809a65c8f': 'Axo',
  '4dd522fb07d1f895ee63270b040e8b6434aa848a9c48ee16a7903aad': 'Fluid Tokens', // Fluid Tokens (repayments) 
  '74f5a268f20a464b086baca44fd4ac4e2dc3c54914e4f1d9212c3f02': 'Fluid Tokens', // Fluid Tokens (loan requests)
  'acbb75f1996b1f50a4a8719307695b6e280c6c3db0d50207c390b6dd': 'AdaHandle',
  'd84e5bd5394b96cb61104439732fdf31fe272275f4a3235c105bc332': 'AdaHandle', // ADA Handle (Personalization)
  '020c5d23c38087ae006e01926cba57ff0022287f9e6fafeb891b77a0': 'AdaHandle', // Ada Handle
  'fa6a58bbe2d0ff05534431c8e2f0ef2cbdc1602a8456e4b13c8f3077': 'Sundaeswap', // SundaeSwap (Order Book)
  '520b2576e83cfd074de6d0a300bfc4abc2c9eef6e02465eebc853f2d': 'Wanchain', // Wanchain (Cross chain bridge)
  '28bbd1f7aebb3bc59e13597f333aeefb8f5ab78eda962de1d605b388': 'Teddyswap', // TeddySwap (liquidity pool)
  '4ab17afc9a19a4f06b6fe229f9501e727d3968bff03acb1a8f86acf5': 'Teddyswap', // TeddySwap (swap) 
  '343f54d6adfb256b1e9041a72a8b519670086570d5611df499c797aa': 'Levvy', // Levvy Finance (Lending v2) 
  '6ec4acc3fbbd570ada625f24902777cec5d7a349fa0f3c7ba87b0cff': 'Dexhunter', // dexhunter stop loss contract
  '1af84a9e697e1e7b042a0a06f061e88182feb9e9ada950b36a916bd5': 'Saturnswap', // swap contract
  'a76f0fb801a29f591e9871576508d85b0b5f3c38774f65032f58fdad': 'Wayup', // wayup marketplace contract
  '00000000000410c2d9e01e8ec78ab1dc6bbc383fae76cbe2689beb02': 'butane',
};

export const getScriptName = (scriptHash) => {
  return scriptMappings[scriptHash] || "Unknown script";
};

export default scriptMappings;
