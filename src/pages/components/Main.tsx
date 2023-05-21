import { useState, useEffect, useRef } from "react";
import SocialLogin from "@biconomy/web3-auth";
import { ChainId } from "@biconomy/core-types";
import { ethers } from "ethers";
import SmartAccount from "@biconomy/smart-account";

const Main = () => {
  const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null);
  const [interval, enableInterval] = useState(false);
  const socialLoginRef = useRef<SocialLogin | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let configureLogin: any;
    if (interval) {
      configureLogin = setInterval(() => {
        if (!!socialLoginRef.current?.provider) {
          setupSmartAccount();
          clearInterval(configureLogin);
        }
      }, 1000);
    }
  }, [interval]);

  async function login() {
    if (!socialLoginRef.current) {
      const socialLoginSDK = new SocialLogin();
      const signature1 = await socialLoginSDK.whitelistUrl(
        "https://localhost:3000"
      );
      await socialLoginSDK.init({
        chainId: ethers.utils.hexValue(ChainId.GOERLI),
        whitelistUrls: {
          "https://localhost:3000": signature1,
        },
      });
      socialLoginRef.current = socialLoginSDK;
    }
    if (!socialLoginRef.current.provider) {
      socialLoginRef.current.showWallet();
      enableInterval(true);
    } else {
      setupSmartAccount();
    }
  }

  async function setupSmartAccount() {
    if (!socialLoginRef?.current?.provider) return;
    socialLoginRef.current.hideWallet();
    setLoading(true);
    const web3Provider = new ethers.providers.Web3Provider(
      socialLoginRef.current.provider
    );
    try {
      const smartAccount = new SmartAccount(web3Provider, {
        activeNetworkId: ChainId.GOERLI,
        supportedNetworksIds: [ChainId.GOERLI],
        networkConfig: [
          {
            chainId: ChainId.GOERLI,
            dappAPIKey: process.env.NEXT_PUBLIC_BICONOMY_API_KEY,
          },
        ],
      });
      await smartAccount.init();

      setSmartAccount(smartAccount);
      setLoading(false);
    } catch (err) {
      console.log("error setting up smart account... ", err);
    }
  }

  const logout = async () => {
    if (!socialLoginRef.current) {
      console.error("Web3Modal not initialized.");
      return;
    }
    await socialLoginRef.current.logout();
    socialLoginRef.current.hideWallet();
    setSmartAccount(null);
    enableInterval(false);
  };

  return (
    <div className="App bg-gray-800 min-h-screen flex flex-col items-center py-6">
      <main className="flex flex-col items-center mt-24 w-11/12 sm:w-1/2 md:w-1/3 lg:w-1/4">
        <h1 className="text-3xl mb-6">Biconomy Social Login</h1>
        {loading && !smartAccount && (
          <p className="text-lg  mb-6">Loading ...</p>
        )}

        {smartAccount ? (
          <>
            <p className="text-lg">Logged in as:</p>
            <p className="text-lg mb-6">{smartAccount.address}</p>
            <button
              className="px-6 py-2 bg-white text-black rounded-xl"
              onClick={logout}
            >
              LOGOUT
            </button>
          </>
        ) : (
          <>
            <button
              className="px-6 py-2 bg-white text-black rounded-xl"
              onClick={login}
            >
              LOGIN
            </button>
          </>
        )}
      </main>
    </div>
  );
};

export default Main;
