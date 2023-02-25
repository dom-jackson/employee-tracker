const inquirer = require('inquirer');
const mysql = require('mysql2');
const cTable = require('console.table');


const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'MYSQLdj1190!',
  database: 'employees_db',
});

connection.connect((err) => {
    if (err) throw err;
    console.log(`connected as id ${connection.threadId}\n`);
    start();
  });

function start() {
    inquirer.prompt({
        name: 'action',
        type: 'list',
        message: 'What would you like to do?',
        choices: [
            'View all departments',
            'View all roles',
            'View all employees',
            'Add a Department',
            'Add a role',
            'Add an employee',
            'Update an employee role'
        ],
    })
    .then((answer) => {
        switch (answer.action) {
            case 'View all departments':
                viewDepartments();
                break;
            case 'View all roles':
                viewRoles();
                break;
            case 'View all employees':
                viewEmployees();
                break;
            case 'Add a Department':
                addDepartment();
                break;
            case 'Add a role':
                addRole();
                break;
            case 'Add an employee':
                addEmployee();
                break;
            case 'Update an employee role':
                updateEmployeeRole();
                break;
        }
    });
}

function viewDepartments() {
    const query = `SELECT id AS "Department ID", name AS "Department Name" FROM department`;
    connection.query(query, (err, res) => {
        if (err) throw err;
        console.table(res);
        start();
    });
}

function viewRoles() {
    const query = `SELECT role.id AS "Role ID", title AS "Job Title", department.name AS "Department", salary AS "Salary"
    FROM role
    INNER JOIN department ON role.department_id = department.id`;
  connection.query(query, (err, res) => {
    if (err) throw err;
    console.table(res);
    start();
  });
}

function viewEmployees() {
    const query = `
      SELECT employee.id AS "Employee ID", employee.first_name AS "First Name", employee.last_name AS "Last Name",
        role.title AS "Job Title", department.name AS "Department", role.salary AS "Salary", employee.manager_name AS "Manager"
      FROM employee
      INNER JOIN role ON employee.role_id = role.id
      INNER JOIN department ON role.department_id = department.id`;
    connection.query(query, (err, res) => {
      if (err) throw err;
      console.table(res);
      start();
    });

}

  function addDepartment() {
    inquirer.prompt({
      name: 'name',
      type: 'input',
      message: 'What is the name of the Department?'
    })
    .then((answer) => {
      const query = 'INSERT INTO department (name) VALUES (?)';
      connection.query(query, [answer.name], (err, res) => {
        if (err) throw err;
        console.log(`Added ${answer.name} to the database.`);
        start()
        }
      );
    });
}

function addRole() {
    connection.query('SELECT * FROM department', (err, res) => {
      if (err) throw err;
  
      inquirer.prompt([
        {
          name: 'title',
          type: 'input',
          message: 'What is the name of the role?'
        },
        {
          name: 'salary',
          type: 'input',
          message: 'What is the salary for this role?:',
          validate: (value) => {
            if (isNaN(value) === false) {
              return true;
            }
            return 'Please enter a valid number.';
          },
        },
        {
          name: 'department_id',
          type: 'list',
          message: 'Which department does the role belong to?',
          choices: () => {
            const departmentChoices = [];
            res.forEach((department) => {
              departmentChoices.push(department.name);
            });
            return departmentChoices;
          },
        },
      ])
      .then((answer) => {
        const chosenDepartment = res.find((department) => department.name === answer.department_id);
        connection.query(
          `INSERT INTO role SET ?`,
          {
            title: answer.title,
            salary: answer.salary,
            department_id: chosenDepartment.id,
          },
          (err, res) => {
            if (err) throw err;
            console.log(`Added ${answer.title} to the Database\n`);
            start(); 
          }
        );
      });
    });
}

function addEmployee () {
  connection.query('SELECT * FROM role', (err, roles) => {
    if (err) throw err;

    connection.query('SELECT * FROM employee', (err, employees) => {
      if (err) throw err;

      
      inquirer.prompt([
        {
          name: 'first_name',
          type: 'input',
          message: "What is the employee's first name?",
        },
        {
          name: 'last_name',
          type: 'input',
          message: "What is the employee's last name?",
        },
        {
          name: 'role',
          type: 'list',
          message: "What is the employee's role?",
          choices: () => {
            const roleChoices = [];
            roles.forEach((role) => {
              roleChoices.push(role.title);
            });
            return roleChoices;
          },
        },
        {
          name: 'manager',
          type: 'list',
          message: "Who is the employee's manager?",
          choices: () => {
            const managerChoices = ['None'];
            employees.forEach((employee) => {
              const fullName = `${employee.first_name} ${employee.last_name}`;
              if (!managerChoices.includes(fullName)) {
                managerChoices.push(fullName);
              }
            });
            return managerChoices;
          },
        },
      ])
      .then((answer) => {
        let roleId;
        roles.forEach((role) => {
          if (role.title === answer.role) {
            roleId = role.id;
          }
        });

        let managerId = null;
        if (answer.manager !== 'None') {
          employees.forEach((employee) => {
            const fullName = `${employee.first_name} ${employee.last_name}`;
            if (fullName === answer.manager) {
              managerId = employee.id;
            }
          });
        }

        connection.query(
          'INSERT INTO employee SET ?',
          {
            first_name: answer.first_name,
            last_name: answer.last_name,
            role_id: roleId,
            manager_name: managerId,
          },
          (err) => {
            if (err) throw err;
            console.log(`Added ${answer.first_name} ${answer.last_name} to the database`);
            start();
          }
        );
      });
  });
});
}

function updateEmployeeRole() {
  let employeeList = [];
  let roleList = [];

  connection.query('SELECT * FROM employee', (err, res) => {
    if (err) throw err;

    employeeList = res.map((employee) => ({
      name: `${employee.first_name} ${employee.last_name}`,
      value: employee.id,
    }));

    connection.query('SELECT * FROM role', (err, res) => {
      if (err) throw err;

      roleList = res.map((role) => ({ name: role.title, value: role.id }));

      inquirer
        .prompt([
          {
            name: 'employeeId',
            type: 'list',
            message: 'Which employee’s role do you want to update?',
            choices: employeeList,
          },
          {
            name: 'roleId',
            type: 'list',
            message: 'Which role do you want to assign to the selected employee?',
            choices: roleList,
          },
        ])
        .then((answer) => {
          connection.query(
            `UPDATE employee SET role_id = ? WHERE id = ?`,
            [answer.roleId, answer.employeeId],
            (err, res) => {
              if (err) throw err;
              console.log(`Updated Employee's role\n`);
              start();
            }
          );
        });
    });
  });
}

  