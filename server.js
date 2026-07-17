require("dotenv").config();

const http = require("http");
const url = require("url");
const db = require("./database");
const PORT = process.env.PORT;

// helper function json
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    });

    res.end(JSON.stringify(data));
}

//  helper function parse body
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", () => {
            try {
                const parsed = body ? JSON.parse(body) : {};
                resolve(parsed);
            } catch (error) {
                reject(error);
            }
        });

        req.on("error", reject);
    });
}

// Function menampilkan data

// Function menampilkan seluruh data notes
async function getNote(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT id, user_id, notes,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
            FROM notes
            ORDER BY created_at ASC
            `);

        sendJSON(res, 200, {
            status: "success",
            total: rows.length,
            data: rows,
        });
    } catch (error) {
        console.error("Error get obat:", error);
        sendJSON(res, 500, {
            status: "error",
            message: "Gagal mengambil data obat",
        });
    }
}

// Function menampilkan data notes berdasarkan id
async function getNoteById(req, res, id) {
    try {
        const [rows] = await db.query(`SELECT * FROM notes WHERE id= ?`, [id]);

        if (rows.length === 0) {
            return sendJSON(res, 404, {
                status: "error",
                message: "Obat tidak ditemukan",
            });
        }
        sendJSON(res, 200, {
            status: "success",
            data: rows[0],
        });
    } catch (error) {
        console.error("Error get obat by id:", error);
        sendJSON(res, 500, {
            status: "error",
            message: "Gagal mengambil data obat",
        });
    }
}


async function createNote(req, res) {
    try {
        const body = await parseBody(req);

        const { user_id, notes } = body;
        if (!user_id || !notes) {
            return sendJSON(res, 400, {
                status: "error",
                message: "Harap isi semua field",
            });
        }

        // insert data ke database
        const [result] = await db.query(
            `
            INSERT INTO notes (user_id, notes)
            VALUES (?, ?)
            `,
            [user_id, notes],
        );

        sendJSON(res, 201, {
            status: "success",
            message: "Note berhasil ditambahkan",
            data: notes,
            id: result.insertId, // mengambil id yang diinsert
        });
    } catch (error) {
        console.error("Error create note:", error);
        sendJSON(res, 500, {
            status: "error",
            message: "Gagal menambahkan note",
        });
    }
}

// fungsi update note
async function updateNote(req, res, id) {
    try {
        const body = await parseBody(req); // mengambil body dari request
        const { notes } = body; // mengambil field dari body
        const updates = []; // menyimpan update ke dalam array updates
        const values = []; // menyimpan nilai dari field yang diupdate

        if (notes !== undefined) {
            // jika field notes ada
            updates.push("notes = ?"); // menambahkan notes ke dalam updates
            values.push(notes); // push nilai notes ke dalam values
        }

        // jika tidak ada field yang diupdate, maka return error
        if (updates.length === 0) {
            return sendJSON(res, 400, {
                status: "error",
                message: "Tidak ada field yang diupdate",
            });
        }

        values.push(id); // push value diatas berdasarkan id

        // update data ke database
        const [result] = await db.query(
            `UPDATE notes SET ${updates.join(", ")} WHERE id = ?`,
            values,
        );

        // jika tidak ada obat yang diupdate, maka return error
        if (result.affectedRows === 0) {
            return sendJSON(res, 404, {
                status: "error",
                message: "Note tidak ditemukan",
            });
        }

        sendJSON(res, 200, {
            status: "success",
            message: "Note berhasil diupdate",
        });
    } catch (error) {
        console.error("Error update obat:", error);
        sendJSON(res, 500, {
            status: "error",
            message: "Gagal mengupdate note",
        });
    }
}

// fungsi menghapus notes
async function deleteNote(req, res, id) {
    try {
        const [check] = await db.query(`SELECT id FROM notes WHERE id = ?`, [id]);
        if (check.length === 0) {
            return sendJSON(res, 404, {
                status: "error",
                message: "Note tidak ditemukan",
            });
        }

        await db.query(`DELETE FROM notes WHERE id = ?`, [id]);
        sendJSON(res, 200, {
            status: "success",
            message: "Note berhasil dihapus",
        });
    } catch (error) {
        console.error("Error delete note:", error);
        sendJSON(res, 500, {
            status: "error",
            message: "Gagal menghapus note",
        });
    }
}

// Membuat server
const server = http.createServer(async (req, res) => {
    // Handle CORS preflight requests for OPTIONS method
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Endpoint welcome
    if (method === "GET" && pathname === "/") {
        sendJSON(res, 200, {
            status: "success",
            message: "Welcome to Node Todo API",
        });
    }
    // endpoint menampilkan seluruh data notes
    if (method === "GET" && pathname === "/api/notes") {
        await getNote(req, res);
    }
    // endpoint menampilkan data notes berdasarkan id
    else if (method === "GET" && pathname.match(/^\/api\/notes\/\d+$/)) {
        const id = parseInt(pathname.split("/")[3]); // split id karena id berada di index 3 setelah /api/notes/
        await getNoteById(req, res, id);
    }

    // endpoint menambahkan note
    else if (method === "POST" && pathname === "/api/notes") {
        await createNote(req, res);
    }

    // endpoint untuk update notes
    else if (method === "PUT" && pathname.match(/^\/api\/notes\/\d+$/)) {
        const id = parseInt(pathname.split("/")[3]); // split id karena id berada di index 3 setelah /api/notes/
        await updateNote(req, res, id);
    }

    // endpoint untuk menghapus note
    else if (method === "DELETE" && pathname.match(/^\/api\/notes\/\d+$/)) {
        const id = parseInt(pathname.split("/")[3]); // split id karena id berada di index 3 setelah /api/notes/
        await deleteNote(req, res, id);
    }

});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});