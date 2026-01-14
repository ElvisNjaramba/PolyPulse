import { useEffect, useState } from "react";
import { fetchWalletHistory } from "../api/wallet";

const Wallet = () => {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletHistory()
      .then(res => setTxs(res.data))
      .finally(() => setLoading(false));
  }, []);

  const isProfitTx = (tx) => {
    return ["win", "refund", "admin_adjustment", "sell"].includes(
      tx.transaction_type
    );
  };

  return (
    <div
      style={{
        maxWidth: "760px",
        margin: "0 auto",
        padding: "24px",
        color: "#e5e7eb",
      }}
    >
      <h2 style={{ marginBottom: "18px" }}>💼 Wallet History</h2>

      {loading && <p>Loading transactions...</p>}

      {!loading && txs.length === 0 && (
        <p style={{ color: "#9ca3af" }}>No transactions yet.</p>
      )}

      {txs.map((tx) => {
        const isCredit = Number(tx.amount) > 0;
        const isProfit = isProfitTx(tx);

        return (
          <div
            key={tx.id}
            style={{
              padding: "14px 16px",
              marginBottom: "12px",
              borderRadius: "14px",
              border: "1px solid #1f2937",
              background: "#0b0f19",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* LEFT */}
            <div>
              <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                {tx.transaction_type.replace("_", " ").toUpperCase()}
              </div>

              {tx.description && (
                <div style={{ fontSize: "13px", color: "#9ca3af" }}>
                  {tx.description}
                </div>
              )}

              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                {new Date(tx.created_at).toLocaleString()}
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "16px",
                  color: isCredit ? "#22c55e" : "#ef4444",
                }}
              >
                {isCredit ? "+" : ""}
                {Number(tx.amount).toFixed(2)}
              </div>

              {/* PROFIT / LOSS LABEL */}
              <div
                style={{
                  fontSize: "12px",
                  marginTop: "4px",
                  color: isProfit ? "#22c55e" : "#9ca3af",
                }}
              >
                {isProfit
                  ? "Profit / Credit"
                  : "Cost / Debit"}
              </div>

              {/* BALANCE AFTER */}
              <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                Balance: {Number(tx.balance_after).toFixed(2)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Wallet;
