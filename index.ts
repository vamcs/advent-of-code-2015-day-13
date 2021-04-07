import * as fs from "fs";
import { isEmpty } from "lodash";

type Connections = { [to: string]: number };

type People = {
  [name: string]: Connections;
};

type HappinessChange = People;

export function read(path: string) {
  console.log("[INFO] Reading file and parsing content...");
  const data = fs.readFileSync(path, "utf-8");

  if (!data) {
    console.error("Can't find file.");
    throw new Error("Can't find file.");
  }

  const people: People = {};
  const rows = data.split("\n");

  rows.forEach((r) => {
    if (!r) {
      return;
    }

    const tokens = r.split(" ");
    const name = tokens[0];

    people[name] = {
      ...people[name],
      [tokens[tokens.length - 1].replace(".", "")]:
        tokens[2] === "gain" ? +tokens[3] : -tokens[3],
    };
  });

  return people;
}

function getMax(connections: Connections) {
  let highest: { name: string; value: number } = {
    name: "",
    value: Number.NEGATIVE_INFINITY,
  };

  Object.keys(connections).forEach((to) => {
    if (connections[to] > highest.value) {
      highest = { name: to, value: connections[to] };
    }
  });

  return highest;
}

function canPersonSit(
  seatedPeople: string[],
  personToBeSeated: string,
  totalAmountOfPeople: number
) {
  // This means that the last person was seated already and we've gone around the table.
  if (
    personToBeSeated == seatedPeople[0] &&
    totalAmountOfPeople == seatedPeople.length
  ) {
    return true;
  }

  if (!seatedPeople.some((p) => p === personToBeSeated)) {
    return true;
  }

  return false;
}

function tryGetValidNextValidPersonToBeSeated(
  connectionsCopy: Connections,
  seatedPeople: string[],
  totalAmountOfPeople: number,
  shouldLog: boolean
): string {
  if (isEmpty(connectionsCopy)) {
    throw new Error("Could not get next possible person to be seated.");
  }

  const nextPersonToBeSeated = getMax(connectionsCopy);
  const isPersonValid = canPersonSit(
    seatedPeople,
    nextPersonToBeSeated.name,
    totalAmountOfPeople
  );

  if (shouldLog) {
    console.log("----SPECIAL LOG----");
    console.log(connectionsCopy);
    console.log(nextPersonToBeSeated, isPersonValid);
    console.log("-------------------");
  }

  const {
    [nextPersonToBeSeated.name]: removedPerson,
    ...otherConnections
  } = connectionsCopy;

  return isPersonValid
    ? nextPersonToBeSeated.name
    : tryGetValidNextValidPersonToBeSeated(
        otherConnections,
        seatedPeople,
        totalAmountOfPeople,
        shouldLog
      );
}

function buildPath(
  person: string,
  happinessChange: HappinessChange,
  seatedPeople: string[],
  totalAmountOfPeople: number,
  total: number,
  path: string
): { total: number; path: string } {
  const nextPersonToBeSeated = tryGetValidNextValidPersonToBeSeated(
    { ...happinessChange[person] },
    seatedPeople,
    totalAmountOfPeople,
    false
  );
  seatedPeople.push(nextPersonToBeSeated);
  const happinessChangeToPerson = happinessChange[person][nextPersonToBeSeated];
  total += happinessChangeToPerson;
  path += `--${happinessChangeToPerson}--${nextPersonToBeSeated}`;

  return seatedPeople.length === totalAmountOfPeople + 1
    ? { total, path }
    : buildPath(
        nextPersonToBeSeated,
        happinessChange,
        seatedPeople,
        totalAmountOfPeople,
        total,
        path
      );
}

export function calculateTotalChange(inputFilePath: string) {
  console.log("[INFO] Starting.");
  console.log("[DEBUG] File path received", inputFilePath);

  if (!inputFilePath) {
    return;
  }

  const data = read(inputFilePath);
  const people = { ...data };
  const happinessChange: HappinessChange = {};

  // Calculate the happiness change between each two people
  Object.keys(people).forEach((name) => {
    Object.keys(people[name]).forEach((to) => {
      if (!happinessChange[name]) {
        happinessChange[name] = {};
      }

      happinessChange[name][to] = people[name][to] + people[to][name];
    });
  });

  console.log("[DEBUG] Happiness change between each two people");
  console.log(happinessChange);

  const totalAmountOfPeople = Object.keys(happinessChange).length;
  console.log("[DEBUG] Total amount of people", totalAmountOfPeople);

  // From each person, calculate how much the total happiness change would be by going around the table
  let highestHappinessChange = Number.NEGATIVE_INFINITY;
  let chosenPath: string = "";
  console.log("[INFO] Possible seating arrangements");
  Object.keys(happinessChange).forEach((person) => {
    const seatedPeople = [person];

    const { total, path } = buildPath(
      person,
      happinessChange,
      seatedPeople,
      totalAmountOfPeople,
      0,
      person
    );

    console.log(path);
    console.log("Happiness change:", total, "\n");

    if (total > highestHappinessChange) {
      highestHappinessChange = total;
      chosenPath = path;
    }
  });

  console.log("Final result:");
  console.log("Highest happiness change:", highestHappinessChange);
  console.log("Chosen seating arrangement:");
  console.log(chosenPath);
}

calculateTotalChange(process.argv[2]);
