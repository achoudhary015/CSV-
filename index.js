const CSVtoJSON = require('csvtojson');
const fs = require('fs')

const convert = (path) => {
  return new Promise((resolve, reject) => {
    CSVtoJSON().fromFile(path)
      .then(source => {
        resolve(source)
      })
      .catch(error => {
        console.error(error)
      })
  })
}

Promise.all([convert(process.argv[2]),
convert(process.argv[3]),
convert(process.argv[4]),
convert(process.argv[5])])
  .then(res => {
    const dataObj = {
      courses: {},
      students: {},
      tests: {},
      marks: { ...res[3] }
    }
    res[0].forEach(course => {
      dataObj.courses[course.id] = course
    })
    res[1].forEach(student => {
      dataObj.students[student.id] = student
    })
    res[2].forEach(test => {
      dataObj.tests[test.id] = test
    })

    Object.values(dataObj.students).forEach(student => {
      dataObj.students[student.id].id = Number(dataObj.students[student.id].id)
      const marksFilter = Object.values(dataObj.marks).filter((mark) => mark.student_id == student.id)

      // course averages
      const averages = {}
      marksFilter.forEach(mark => {
        const test = Object.values(dataObj.tests).find(test => test.id === mark.test_id)
        const course = Object.values(dataObj.courses).find(course => course.id === test.course_id)
        const weightedMark = (mark.mark * (test.weight / 100)).toFixed(2)
        if (!averages[course.id]) {
          averages[course.id] = {
            ...course,
            id: Number(course.id),
            average: 0
          }
          averages[course.id].average += Number(weightedMark)
        } else {
          averages[course.id].average += Number(weightedMark)
        }
        averages[course.id].average = Math.round(averages[course.id].average * 100) / 100
      })

      // total average
      const totalAvg = Object.values(averages).reduce((prev, curr) => prev + curr.average, 0) / Object.values(averages).length
      dataObj.students[student.id].totalAverage = Number(Number(totalAvg).toFixed(2))

      dataObj.students[student.id].courses = []
      Object.values(averages).forEach(average => {
        dataObj.students[student.id].courses.push(average)
      })
    })

    const final = {
      students: Object.values(dataObj.students)
    }
    fs.writeFile(process.argv[6], JSON.stringify(final), (err) => {
      if (err) throw err
    })
  })
  .catch(error => {
    console.error(error)
  })