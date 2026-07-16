const fs = require("fs");
const pesanBaru = "Transaksi berhasil: Rp.50.000\n";
const logger = require("./logging");

fs.appendFile("riwayat.txt", pesanBaru, "utf-8", (err) => {
    if (err) {
        console.log("Gagal menambahkan data", err.message);
        return;
    } else {
        console.log("Berhasil menambahkan data");
    }
});
// log ke file
logger.info(pesanBaru);