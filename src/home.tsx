import { useEffect, useState } from 'react'
import {keyStores, connect, WalletConnection, Contract, ConnectedWalletAccount, utils } from "near-api-js";
import { Buffer } from 'buffer';


interface DonationsRecords {
  account_id: string, total_amount: string
}
function Home() {

  
  // const { keyStores, connect, WalletConnection, Contract } = nearAPI;
  const [donation, setDonation] = useState(1)
  const [donationRecords, setDonationRecords] = useState<Array<DonationsRecords>>([])
  const [accountId, setAccountId] = useState("")
  const [beneficiary, setBeneficiary] = useState<string>("")
  const [walletConnection, setWalletConnection] = useState<WalletConnection | undefined>(undefined)
  const [contract, setContract] = useState<Contract | undefined>(undefined)
  const [accountBalance, setAccountBalance] = useState("")

  const contractId = 'dev-1687254547876-16039193712100';
  const THIRTY_TGAS = '30000000000000';
  const getRecentDonations = async (account: ConnectedWalletAccount) => {
    const contract: any = new Contract(
      account, // the account object that is connecting
      contractId,
      {
        viewMethods: ["get_beneficiary", "get_donations", "number_of_donors"],
        changeMethods: ["donate"],
      }
    );

    setContract(contract)

    const result = await contract.get_beneficiary();
    console.log("beneficiary " + result);

    setBeneficiary(result);


    const number_of_donors = await contract.number_of_donors()

    const min = number_of_donors > 10 ? number_of_donors - 9 : 0

    const donations = await contract.get_donations({
      from_index: min.toString(),
      limit: number_of_donors
    })

    console.log("get_donations Result:", donations);

    setDonationRecords(donations)

  }
  const getAccountAbalance = async (account: ConnectedWalletAccount) => {
    const acc = await account.getAccountBalance();


    setAccountBalance(utils.format.formatNearAmount(acc.available));
  }
  useEffect(() => {

    (async () => {

      // Add the following line to set the global Buffer object
      (window as any).Buffer = Buffer;

      const myKeyStore = new keyStores.BrowserLocalStorageKeyStore();


      const connectionConfig = {
        networkId: "testnet",
        keyStore: myKeyStore, // first create a key store 
        nodeUrl: "https://rpc.testnet.near.org",
        walletUrl: "https://wallet.testnet.near.org",
        helperUrl: "https://helper.testnet.near.org",
        explorerUrl: "https://explorer.testnet.near.org",
      };
      const nearConnection = await connect({ headers: {}, ...connectionConfig });
      const walletConnection = new WalletConnection(nearConnection, null);
      setWalletConnection(walletConnection)

      if (walletConnection.isSignedIn()) {
        // set you account name
        const account = walletConnection.account();

        setAccountId(account.accountId);

        await getAccountAbalance(account);
        await getRecentDonations(account);
      } else {
        console.log("signed not  ........");

      }

    })()

  }, []);




  return (
    <>
      {accountId.length == 0 ? <div className='btn btn-primary' onClick={async () => {

        await walletConnection?.requestSignIn({
          contractId: contractId
        });

        if (walletConnection?.isSignedIn()) {
          const account = walletConnection.account();
          setAccountId(account.accountId);

          await getAccountAbalance(account)
          await getRecentDonations(account);
        }

      }}> login</div> : <div>
        <h1>Hello {accountId} </h1>
        <h6>Account balance {accountBalance}</h6>
        <h6>Beneficiary  {beneficiary}</h6>
        <div className='btn btn-secondary' onClick={async () => {
          await walletConnection?.signOut()
          if (walletConnection?.isSignedIn()) {
            alert("No able to sign out")

          } else {
            setAccountId("")
            setAccountBalance("")
          }

        }}> logout</div>

        <form>
          <input type='number' value={donation} onChange={(e) => setDonation(e.target.valueAsNumber)}></input>
          <div className='btn btn-success mx-5' onClick={() => {
            const con = contract as any

            const deposit = utils.format.parseNearAmount(donation.toString())
            con.donate({
              amount: deposit
            },THIRTY_TGAS , deposit)
          }}>
            Donate
          </div>
        </form>

        <ul>
          {
            donationRecords.map((e) => {
              return <li key={e.account_id}>{e.account_id} -- {utils.format.formatNearAmount(e.total_amount)}</li>
            })
          }
        </ul>
      </div>}




    </>
  )
}

export default Home
