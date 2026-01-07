import { useEffect, useState } from "react";
import { fetchWalletHistory } from "../api/wallet";

const Wallet = () => {
  const [txs, setTxs] = useState([]);

  useEffect(() => {
    fetchWalletHistory().then(res => setTxs(res.data));
  }, []);

  return (
    <div>
      <h2>Wallet</h2>
      {txs.map(t => (
        <div key={t.id}>
          {t.type} — {t.amount}
        </div>
      ))}
    </div>
  );
};

export default Wallet;
