const fs = require("fs");
const csv = require("csv-parser");
const prompts = require('prompts');


const sortEmployeeByProjectDuration = (arr) => {
  return arr.sort((a, b) => {
    a.DateTo = a.DateTo.trim();
    a.DateFrom = a.DateFrom.trim();
    b.DateTo = b.DateTo.trim();
    b.DateFrom = b.DateFrom.trim();

    if (a.DateTo === 'NULL') {
      a.DateTo = new Date().toLocaleDateString('en-CA')
    } else if (a.DateTo === 'NULL') {
      b.DateTo = new Date().toLocaleDateString('en-CA')
    }

    const employeeOneFrom = new Date(a.DateFrom);
    const employeeOneTo = new Date(a.DateTo);
    const employeeOneDuration = employeeOneTo.getTime() - employeeOneFrom.getTime();

    const employeeTwoFrom = new Date(b.DateFrom);
    const employeeTwoTo = new Date(b.DateTo);
    const employeeTwoDuration = employeeTwoTo.getTime() - employeeTwoFrom.getTime();


    return new Date(employeeTwoDuration) - new Date(employeeOneDuration);

  })
}


(async () => {

  const buckets = {};

  const userOptions = await prompts([
    {
      type: 'select',
      name: 'file',
      message: 'Pick a CSV',
      choices: fs.readdirSync(`${process.cwd()}/data/`).map(e => { return { title: e, value: e } }),
      initial: 1
    }
  ]);

  const filePath = `${process.cwd()}/data/${userOptions.file}`;

  try {
    fs.readFileSync(filePath)
  } catch (error) {
    console.log(`No such file ${filePath} in the data folder!`)
  }


  fs.createReadStream(filePath)
    .pipe(csv(["EmpID", "ProjectID", "DateFrom", "DateTo"]))

    .on("data", (data) => {
      if (buckets[data.ProjectID.trim()]) {
        buckets[data.ProjectID.trim()] = [
          ...buckets[data.ProjectID.trim()],
          {
            ...data
          }
        ]

      } else {
        buckets[data.ProjectID.trim()] = [
          {
            ...data
          }
        ]
      }

    })
    .on("end", async () => {
      const result = {}
      const selectOptions = [];

      for (project in buckets) {
        selectOptions.push({ title: project, value: project })
        result[project] = (sortEmployeeByProjectDuration(buckets[project]))
      }

      const selectProjectResults = await prompts([
        {
          type: 'select',
          name: 'project',
          message: 'Select project',
          choices: selectOptions,
          initial: 1
        }
      ]);
      const ogEmployees = result[selectProjectResults.project].slice(0, 2).filter(employee => Boolean(employee))

      const stringResult = ogEmployees.map(element => {
        return element.EmpID;
      });

      console.log(`EMPLOYEES WITH LONGEST TIME SPENT ON PROJECT N=${selectProjectResults.project}`, stringResult)

    });


})()

