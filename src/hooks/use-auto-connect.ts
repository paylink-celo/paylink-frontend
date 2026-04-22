import { useEffect, useState } from "react";
import { useConnect, useConnectors } from "wagmi";

export function useAutoConnect() {
  const connectors = useConnectors();
  const connect = useConnect();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    if (hasAttempted || connectors.length === 0) return;

    connect.mutate(
      { connector: connectors[0] },
      {
        onSettled: () => setHasAttempted(true),
        onError: (err) => console.error("Failed to connect:", err),
      },
    );
  }, [connectors, connect, hasAttempted]);

  return { error: connect.error, isPending: connect.isPending, hasAttempted };
}
