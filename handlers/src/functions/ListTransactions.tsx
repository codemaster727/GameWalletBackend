// get the client
import mysql from 'mysql2/promise';
import { getEventBody } from "../resources/Utils"
import { ListTransactionsRequest } from "../../../server/src/requests/ListTransactionsRequest"

export async function handler(event: any) {
  const request = getEventBody(event) as ListTransactionsRequest
  const {id, user_id, token_id, net_id, type, limit, page_number} = request;
  // create the connection to database
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PW,
    database: process.env.DATABASE_NAME
  });

  const query_array = [];
  let query = `SELECT * FROM ${"`" + process.env.DATABASE_NAME + "`"} WHERE`;
  if (id) {
    query += ' `id` = ? AND';
    query_array.push(id);
  }
  if (user_id) {
      query += ' `user_id` = ? AND';
      query_array.push(user_id);
  }
  if (token_id && token_id !== "0") {
      query += ' `token_id` = ? AND';
      query_array.push(token_id);
  }
  if (net_id && net_id !== "0") {
      query += ' `net_id` = ? AND';
      query_array.push(net_id);
  }
  if (type) {
      query += ' `type` = ? AND';
      query_array.push(type);
  }
  if (!(query.includes("?"))) {
      query = query.replace("WHERE", "");
  } else {
      query = query.slice(0, query.length - 3);
  }
  query = query.concat('ORDER BY id DESC ')
  query = query.concat(`LIMIT ${limit ?? 10} OFFSET ${(page_number ?? 0) * (limit ?? 10)}`);

  // simple query
  const [rows, fields] = await connection.execute(
    query,
    query_array,
  );

  const count_query = query.slice(0, query.indexOf("LIMIT")).replace("*", "COUNT(id) As Total");
  const [total] = await connection.execute(count_query, query_array);

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      rows,
      total,
    }),
  };
};
