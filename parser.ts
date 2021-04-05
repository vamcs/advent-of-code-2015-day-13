import * as fs from "fs";

interface People {
  [key: string]: { to: string; value: number };
}

export function read() {
  fs.readFile("./input.txt", "utf-8", (error, data) => {
    console.log(data);
  });
}
