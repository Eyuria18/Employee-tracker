const inquirer = require('inquirer');
const db = require('./db/db'); // Import the database queries from db.js

// Start the application and show the main menu
function startApp() {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'View all departments',
          'View all roles',
          'View all employees',
          'Add a department',
          'Add a role',
          'Add an employee',
          'Update an employee role',
          'Exit'
        ],
      },
    ])
    .then((answers) => {
      switch (answers.action) {
        case 'View all departments':
          viewDepartments();
          break;
        case 'View all roles':
          viewRoles();
          break;
        case 'View all employees':
          viewEmployees();
          break;
        case 'Add a department':
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
        case 'Exit':
          console.log('Goodbye!');
          process.exit();
      }
    });
}

// Show departments
function viewDepartments() {
  db.query('SELECT * FROM department', (err, res) => {
    if (err) {
      console.error(err);
    } else {
      console.table(res.rows);
      startApp(); // Show the menu again after showing the departments
    }
  });
}

// Show roles
function viewRoles() {
  db.query(
    'SELECT role.id, role.title, department.name AS department, role.salary FROM role JOIN department ON role.department_id = department.id',
    (err, res) => {
      if (err) {
        console.error(err);
      } else {
        console.table(res.rows);
        startApp(); // Show the menu again after showing the roles
      }
    }
  );
}

// Show employees
function viewEmployees() {
  db.query(
    'SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, manager.first_name AS manager FROM employee LEFT JOIN role ON employee.role_id = role.id LEFT JOIN department ON role.department_id = department.id LEFT JOIN employee manager ON employee.manager_id = manager.id',
    (err, res) => {
      if (err) {
        console.error(err);
      } else {
        console.table(res.rows);
        startApp(); // Show the menu again after showing the employees
      }
    }
  );
}

// Add a department
function addDepartment() {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'departmentName',
        message: 'Enter the name of the department:',
      },
    ])
    .then((answers) => {
      const query = 'INSERT INTO department (name) VALUES ($1)';
      const values = [answers.departmentName];
      db.query(query, values, (err, res) => {
        if (err) {
          console.error(err);
        } else {
          console.log(`Department ${answers.departmentName} added!`);
          startApp();
        }
      });
    });
}

// Add a role
function addRole() {
  // Get departments first to populate the department list
  db.query('SELECT * FROM department', (err, res) => {
    if (err) {
      console.error(err);
    } else {
      inquirer
        .prompt([
          {
            type: 'input',
            name: 'title',
            message: 'Enter the title of the role:',
          },
          {
            type: 'input',
            name: 'salary',
            message: 'Enter the salary for the role:',
          },
          {
            type: 'list',
            name: 'department',
            message: 'Which department is this role in?',
            choices: res.rows.map((dept) => dept.name), // Dynamically populate departments
          },
        ])
        .then((answers) => {
          const departmentId = res.rows.find((dept) => dept.name === answers.department).id;
          const query = 'INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)';
          const values = [answers.title, answers.salary, departmentId];
          db.query(query, values, (err, res) => {
            if (err) {
              console.error(err);
            } else {
              console.log(`Role ${answers.title} added!`);
              startApp();
            }
          });
        });
    }
  });
}

// Add an employee
function addEmployee() {
  // First, get roles and managers for the selection options
  db.query('SELECT * FROM role', (err, rolesRes) => {
    if (err) {
      console.error(err);
    } else {
      db.query('SELECT * FROM employee', (err, employeesRes) => {
        if (err) {
          console.error(err);
        } else {
          inquirer
            .prompt([
              {
                type: 'input',
                name: 'firstName',
                message: "Enter the employee's first name:",
              },
              {
                type: 'input',
                name: 'lastName',
                message: "Enter the employee's last name:",
              },
              {
                type: 'list',
                name: 'role',
                message: "Select the employee's role:",
                choices: rolesRes.rows.map((role) => role.title), // Dynamically populate roles
              },
              {
                type: 'list',
                name: 'manager',
                message: "Select the employee's manager:",
                choices: employeesRes.rows.map((emp) => `${emp.first_name} ${emp.last_name}`),
              },
            ])
            .then((answers) => {
              const roleId = rolesRes.rows.find((role) => role.title === answers.role).id;
              const managerName = answers.manager.split(' ');
              const managerId = employeesRes.rows.find(
                (emp) => emp.first_name === managerName[0] && emp.last_name === managerName[1]
              ).id;

              const query =
                'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)';
              const values = [answers.firstName, answers.lastName, roleId, managerId];
              db.query(query, values, (err, res) => {
                if (err) {
                  console.error(err);
                } else {
                  console.log(`Employee ${answers.firstName} ${answers.lastName} added!`);
                  startApp();
                }
              });
            });
        }
      });
    }
  });
}

// Update an employee role
function updateEmployeeRole() {
  db.query('SELECT id, first_name, last_name FROM employee', (err, empRes) => {
    if (err) {
      console.error(err);
    } else {
      db.query('SELECT id, title FROM role', (err, roleRes) => {
        if (err) {
          console.error(err);
        } else {
          inquirer
            .prompt([
              {
                type: 'list',
                name: 'employee',
                message: "Select the employee to update:",
                choices: empRes.rows.map((emp) => `${emp.first_name} ${emp.last_name}`),
              },
              {
                type: 'list',
                name: 'role',
                message: "Select the employee's new role:",
                choices: roleRes.rows.map((role) => role.title),
              },
            ])
            .then((answers) => {
              const employeeId = empRes.rows.find(
                (emp) => `${emp.first_name} ${emp.last_name}` === answers.employee
              ).id;
              const roleId = roleRes.rows.find((role) => role.title === answers.role).id;

              const query = 'UPDATE employee SET role_id = $1 WHERE id = $2';
              const values = [roleId, employeeId];
              db.query(query, values, (err, res) => {
                if (err) {
                  console.error(err);
                } else {
                  console.log(`Employee's role updated!`);
                  startApp();
                }
              });
            });
        }
      });
    }
  });
}

startApp(); // Start the application
