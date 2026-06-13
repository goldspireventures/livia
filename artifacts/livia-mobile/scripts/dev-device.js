/**

 * Start Expo for testing on a physical device on the same LAN.

 * Sets API + Metro hostnames to this machine's IPv4 address.

 */

const { spawn } = require("child_process");

const net = require("net");

const os = require("os");



function getLanIPv4() {

  const nets = os.networkInterfaces();

  const candidates = [];



  for (const name of Object.keys(nets)) {

    const ifaces = nets[name];

    if (!ifaces) continue;

    for (const iface of ifaces) {

      if (iface.family !== "IPv4" || iface.internal) continue;

      const addr = iface.address;

      if (addr.startsWith("169.254.")) continue;

      if (/^(vEthernet|VirtualBox|VMware|WSL|Loopback)/i.test(name)) continue;

      candidates.push({ name, addr });

    }

  }



  const preferred = candidates.find((c) =>

    /^(Wi-Fi|WLAN|Ethernet|en\d|eth\d)/i.test(c.name),

  );

  return (preferred ?? candidates[0])?.addr;

}



function portFree(port) {

  return new Promise((resolve) => {

    const server = net.createServer();

    server.once("error", () => resolve(false));

    server.once("listening", () => server.close(() => resolve(true)));

    server.listen(port, "0.0.0.0");

  });

}



async function pickPort(preferred = 8083) {

  for (let p = preferred; p < preferred + 10; p++) {

    if (await portFree(p)) return p;

  }

  throw new Error(`No free port between ${preferred} and ${preferred + 9}`);

}



async function main() {

  const ip = process.env.LIVIA_DEV_HOST?.trim() || getLanIPv4();

  if (!ip) {

    console.error(

      "Could not detect a LAN IPv4 address. Set LIVIA_DEV_HOST=192.168.x.x and retry.",

    );

    process.exit(1);

  }



  const preferredPort = Number(process.env.LIVIA_METRO_PORT) || 8083;

  const port = await pickPort(preferredPort);

  if (port !== preferredPort) {

    console.warn(`  Port ${preferredPort} busy — using ${port} instead.`);

  }



  const apiBase = `http://${ip}:3000`;
  const dashboardBase = `http://${ip}:5173`;

  console.log("");

  console.log("  Physical device dev");

  console.log(`  API:       ${apiBase}`);
  console.log(`  Dashboard: ${dashboardBase}`);

  console.log(`  Metro: exp://${ip}:${port}`);
  console.log("");
  console.log("  No QR? Expo Go → Enter URL manually → paste the Metro line above.");
  console.log("");
  console.log("  Phone and PC must be on the same Wi‑Fi.");

  console.log("  Allow Node through Windows Firewall if prompted.");

  console.log("");



  const clearCache = process.argv.includes("--clear");



  // Expo hides the QR code and disables watch mode when CI=true (often set by IDEs).
  const { CI: _ci, ...processEnv } = process.env;

  const env = {
    ...processEnv,
    EXPO_PUBLIC_API_BASE_URL: apiBase,
    EXPO_PUBLIC_DASHBOARD_URL: dashboardBase,
    EXPO_PUBLIC_DOMAIN: `${ip}:3000`,
    REACT_NATIVE_PACKAGER_HOSTNAME: ip,
    EXPO_OFFLINE: "1",
  };



  const child = spawn(

    "pnpm",

    ["exec", "expo", "start", "--port", String(port), "--lan", ...(clearCache ? ["--clear"] : [])],

    {

      cwd: require("path").join(__dirname, ".."),

      env,

      stdio: "inherit",

      shell: true,

    },

  );



  child.on("exit", (code) => process.exit(code ?? 0));

}



main().catch((err) => {

  console.error(err);

  process.exit(1);

});


