import dns from "dns";

// Beberapa mesin (mis. Windows tanpa resolver lokal) membuat Node memakai DNS 127.0.0.1,
// sehingga lookup SRV mongodb+srv:// gagal. Fallback ke DNS publik hanya dalam kasus itu.
// dns dan dns.promises punya resolver sendiri-sendiri, jadi keduanya harus diset.
const servers = dns.getServers();
if (servers.length > 0 && servers.every((s) => s === "127.0.0.1" || s === "::1")) {
  const fallback = ["8.8.8.8", "1.1.1.1"];
  dns.setServers(fallback);
  dns.promises.setServers(fallback);
}
