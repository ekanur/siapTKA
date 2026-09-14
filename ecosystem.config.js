module.exports = {
  apps: [
    {
      name: "siaptka",
      // Menjalankan binary Next.js secara langsung (bukan via wrapper npm)
      // agar PM2 cluster mode dapat membagi port 3000 tanpa tabrakan EADDRINUSE
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: "max", // Memanfaatkan seluruh core CPU server secara seimbang
      exec_mode: "cluster",
      max_memory_restart: "750M",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
      time: true, // Tambahkan timestamp pada setiap baris log PM2
    },
  ],
};
