import * as fs from "fs";
import { isEmpty } from "lodash";

type Connections = { [to: string]: number };

type People = {
  [name: string]: Connections;
};

type HappinessChange = People;

export function read(path: string) {
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

export function calculateTotalChange(path: string) {
  console.log("Starting.");
  console.log("Path received", path);

  if (!path) {
    return;
  }

  const data = read(path);
  const people = { ...data };
  const happinessChange: HappinessChange = {};

  Object.keys(people).forEach((name) => {
    // Calculate the happiness change between each two people
    Object.keys(people[name]).forEach((to) => {
      if (!happinessChange[name]) {
        happinessChange[name] = {};
      }

      happinessChange[name][to] = people[name][to] + people[to][name];
    });
  });

  console.log("Happiness change", happinessChange);

  const totalAmountOfPeople = Object.keys(happinessChange).length;
  console.log("Total amount of people", totalAmountOfPeople);
  // From each person, calculate how much the total happiness change would be by going around the table
  let highestHappinessChange = Number.NEGATIVE_INFINITY;
  let chosenPath: string = "";
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
    console.log(total);

    if (total > highestHappinessChange) {
      highestHappinessChange = total;
      chosenPath = path;
    }
  });

  console.log("Highest happiness change:", highestHappinessChange);
  console.log("Chosen path:");
  console.log(chosenPath);

  // Find the arrangement with the highest happiness change

  // Get the two highest happiness changes from each person without repetitions,
  // then sum everything to get the total happiness change.
  // const totalHappinessChange = Object.keys(happinessChange)
  //   .map((name) => {
  //     const highest = getMax(happinessChange[name]);

  //     const connectionsCopy = { ...happinessChange[name] };
  //     delete connectionsCopy[highest.name];

  //     const secondHighest = getMax(connectionsCopy);

  //     console.log(`Person ${name}`);
  //     console.log(`Highest`, highest);
  //     console.log(`Second highest`, secondHighest);

  //     return highest.value + secondHighest.value;
  //   })
  //   .reduce((acc, current) => acc + current, 0);

  // console.log(`Total happiness change: ${totalHappinessChange}`);
}

calculateTotalChange(process.argv[2]);
