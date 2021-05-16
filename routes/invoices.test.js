process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testInvoice;

beforeEach(async () => {
    const result = await db.query(`INSERT INTO companies
    VALUES ('apple', 'Apple Computer', 'Maker of OSX.') RETURNING code,name,description`);
    const invoice = await db.query(`INSERT INTO invoices (comp_code, amt, paid, paid_date)
    VALUES ('apple', 100, false, null) RETURNING id, comp_code, amt, paid, add_date, paid_date`)
    testInvoice = invoice.rows[0]
})

afterEach(async () => {
    await db.query(`DELETE FROM companies`)
})

afterAll(async () => {
    await db.end()
})

describe("GET /invoices", () => {
    test("Get all invoices", async () => {
        const res = await request(app).get('/invoices');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            invoices: [
                {
                    "id": expect.any(Number),
                    "comp_code": "apple",
                    "amt": 100,
                    "paid": false,
                    "add_date": expect.any(String),
                    "paid_date": null
                }]
        })
    })
})

describe("GET /invoice:id", () => {
    test("Get invoice by id", async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`)
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            "invoice": {
                "id": expect.any(Number),
                "amt": 100,
                "paid": false,
                "add_date": expect.any(String),
                "paid_date": null,
                "company": {
                    "name": "Apple Computer",
                    "description": "Maker of OSX."
                }
            }
        })
    })
})

describe("POST /", () => {
    test("add single invoice", async () => {
        const res = await request(app).post("/invoices").send({ amt: 400, comp_code: "apple" })

        expect(res.body).toEqual(
            {
                "invoice": {
                    "id": expect.any(Number),
                    "comp_code": "apple",
                    "amt": 400,
                    "paid": false,
                    "add_date": expect.any(String),
                    "paid_date": null,
                }
            }
        )
    })
})

describe("PUT /", () => {
    test("Update an invoice", async () => {
        const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ amt: 4000, paid: false })
        expect(res.body).toEqual(
            {
                "invoice": {
                    "id": expect.any(Number),
                    "comp_code": "apple",
                    "amt": 4000,
                    "paid": false,
                    "add_date": expect.any(String),
                    "paid_date": null,
                }
            }
        )
    })
})

describe("DELETE /", () => {
    test("delete an invoice", async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`)
        expect(res.body).toEqual({ "status": "deleted" })
    })
})