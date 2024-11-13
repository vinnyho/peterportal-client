import React, { FC, useState, useEffect } from 'react';
import { Dropdown, Grid, DropdownProps } from 'semantic-ui-react';
import Chart from './Chart';
import Pie from './Pie';
import './GradeDist.scss';

import { CourseGQLData, ProfessorGQLData } from '../../types/types';
import { GradesRaw, QuarterName } from '@peterportal/types';
import trpc from '../../trpc';

interface GradeDistProps {
  course?: CourseGQLData;
  professor?: ProfessorGQLData;
  minify?: boolean;
}

interface Entry {
  value: string;
  text: string;
}

type ChartTypes = 'bar' | 'pie';

const GradeDist: FC<GradeDistProps> = (props) => {
  const quarterOrder: QuarterName[] = ['Winter', 'Spring', 'Summer1', 'Summer10wk', 'Summer2', 'Fall'];
  /*
   * Initialize a GradeDist block on the webpage.
   * @param props attributes received from the parent element
   */

  const [gradeDistData, setGradeDistData] = useState<GradesRaw>(null!);
  const [chartType, setChartType] = useState<ChartTypes>('bar');
  const [currentQuarter, setCurrentQuarter] = useState('');
  const [currentProf, setCurrentProf] = useState('');
  const [profEntries, setProfEntries] = useState<Entry[]>(null!);
  const [currentCourse, setCurrentCourse] = useState('');
  const [courseEntries, setCourseEntries] = useState<Entry[]>(null!);
  const [quarterEntries, setQuarterEntries] = useState<Entry[]>(null!);

  const fetchGradeDistData = () => {
    let requests: Promise<GradesRaw>[];
    // course context
    if (props.course) {
      const params = {
        department: props.course.department,
        number: props.course.courseNumber,
      };
      requests = [trpc.courses.grades.query(params)];
    } else if (props.professor) {
      requests = props.professor.shortenedNames.map((name) => trpc.professors.grades.query({ name }));
    }

    Promise.all(requests!)
      .then((res) => res.flat())
      .then(setGradeDistData)
      .catch((error) => {
        setGradeDistData([]);
        console.error(error.response);
      });
  };

  // reset any data from a previous course or professor, get new data for course or professor
  useEffect(() => {
    setGradeDistData(null!);
    fetchGradeDistData();
  }, [props.course?.id, props.professor?.ucinetid]);

  // update list of professors/courses when new course/professor is detected
  useEffect(() => {
    if (gradeDistData && gradeDistData.length !== 0) {
      if (props.course) {
        createProfEntries();
      } else if (props.professor) {
        createCourseEntries();
      }
    }
  }, [gradeDistData]);

  // update list of quarters when new professor/course is chosen
  useEffect(() => {
    if ((currentProf || currentCourse) && gradeDistData.length !== 0) {
      createQuarterEntries();
    }
  }, [currentProf, currentCourse]);

  /*
   * Create an array of objects to feed into the quarter dropdown menu.
   * @return an array of JSON objects recording each quarter
   */
  const createQuarterEntries = () => {
    const quarters: Set<string> = new Set();
    const result: Entry[] = [{ value: 'ALL', text: 'All Quarters' }];

    gradeDistData
      .filter((entry) => {
        if (props.course && entry.instructors.includes(currentProf)) {
          return true;
        }
        if (props.professor && entry.department + ' ' + entry.courseNumber == currentCourse) {
          return true;
        }
        return false;
      })
      .forEach((data) => quarters.add(data.quarter + ' ' + data.year));
    quarters.forEach((quarter) => result.push({ value: quarter, text: quarter }));

    setQuarterEntries(
      result.sort((a, b) => {
        if (a.value === 'ALL') {
          return -1;
        }
        if (b.value === 'ALL') {
          return 1;
        }
        const [thisQuarter, thisYear] = a.value.split(' ') as [QuarterName, string];
        const [thatQuarter, thatYear] = b.value.split(' ') as [QuarterName, string];
        if (thisYear === thatYear) {
          return quarterOrder.indexOf(thatQuarter) - quarterOrder.indexOf(thisQuarter);
        } else {
          return Number.parseInt(thatYear, 10) - Number.parseInt(thisYear, 10);
        }
      }),
    );
    setCurrentQuarter(result[0].value);
  };

  /*
   * Create an array of objects to feed into the professor dropdown menu.
   * @return an array of JSON objects recording professor's names
   */
  const createProfEntries = () => {
    const professors: Set<string> = new Set();
    const result: Entry[] = [];

    gradeDistData.forEach((match) => match.instructors.forEach((prof) => professors.add(prof)));

    Array.from(professors)
      .sort((a, b) => a.localeCompare(b))
      .forEach((professor) => result.push({ value: professor, text: professor }));

    setProfEntries(result);
    setCurrentProf(result[0].value);
  };

  /*
   * Create an array of objects to feed into the course dropdown menu.
   * @return an array of JSON objects recording course's names
   */
  const createCourseEntries = () => {
    const courses: Set<string> = new Set();
    const result: Entry[] = [];

    gradeDistData.forEach((match) => courses.add(match.department + ' ' + match.courseNumber));

    Array.from(courses)
      .sort((a, b) => a.localeCompare(b))
      .forEach((course) => result.push({ value: course, text: course }));

    setCourseEntries(result);
    setCurrentCourse(result[0].value);
  };

  /*
   * Record what is in the quarter dropdown menu at the moment.
   * @param event an event object recording the mouse movement, etc.
   * @param status details about the status in the dropdown menu
   */
  const updateCurrentQuarter = (_: React.SyntheticEvent<HTMLElement>, status: DropdownProps) => {
    setCurrentQuarter(status.value as string);
  };

  /*
   * Record what is in the professor dropdown menu at the moment.
   * @param event an event object recording the mouse movement, etc.
   * @param status details about the status in the dropdown menu
   */
  const updateCurrentProf = (_: React.SyntheticEvent<HTMLElement>, status: DropdownProps) => {
    setCurrentProf(status.value as string);
  };

  /*
   * Record what is in the course dropdown menu at the moment.
   * @param event an event object recording the mouse movement, etc.
   * @param status details about the status in the dropdown menu
   */
  const updateCurrentCourse = (_: React.SyntheticEvent<HTMLElement>, status: DropdownProps) => {
    setCurrentCourse(status.value as string);
  };

  const optionsRow = (
    <Grid.Row id="menu">
      {props.minify && (
        <Grid.Column className="gradedist-filter">
          <Dropdown
            placeholder="Chart Type"
            scrolling
            selection
            options={[
              { text: 'Bar', value: 'bar' },
              { text: 'Pie', value: 'pie' },
            ]}
            value={chartType}
            onChange={(_, s) => setChartType(s.value as ChartTypes)}
          />
        </Grid.Column>
      )}

      <Grid.Column className="gradedist-filter">
        <Dropdown
          placeholder={props.course ? 'Professor' : 'Course'}
          scrolling
          selection
          options={props.course ? profEntries : courseEntries}
          value={props.course ? currentProf : currentCourse}
          onChange={props.course ? updateCurrentProf : updateCurrentCourse}
        />
      </Grid.Column>

      <Grid.Column className="gradedist-filter">
        <Dropdown
          placeholder="Quarter"
          scrolling
          selection
          options={quarterEntries}
          value={currentQuarter}
          onChange={updateCurrentQuarter}
        />
      </Grid.Column>
    </Grid.Row>
  );

  if (gradeDistData !== null && gradeDistData.length !== 0) {
    const graphProps = {
      gradeData: gradeDistData,
      quarter: currentQuarter,
      course: currentCourse,
      professor: currentProf,
    };
    return (
      <div className={`gradedist-module-container ${props.minify ? 'grade-dist-mini' : ''}`}>
        {optionsRow}

        <Grid.Row id="chart">
          {((props.minify && chartType == 'bar') || !props.minify) && (
            <div className={'grade_distribution_chart-container chart'}>
              <Chart {...graphProps} />
            </div>
          )}
          {((props.minify && chartType == 'pie') || !props.minify) && (
            <div className={'grade_distribution_chart-container pie'}>
              <Pie {...graphProps} />
            </div>
          )}
        </Grid.Row>
      </div>
    );
  } else if (gradeDistData == null) {
    // null if still fetching, display loading message
    return (
      <div className={`gradedist-module-container ${props.minify ? 'grade-dist-mini' : ''}`}>
        {optionsRow}
        <div style={{ height: 400, textAlign: 'center' }}>
          <p>Loading Distribution..</p>
        </div>
      </div>
    );
  } else {
    // gradeDistData is empty, did not receive any data from API call or received an error, display an error message
    return (
      <div className={`gradedist-module-container ${props.minify ? 'grade-dist-mini' : ''}`}>
        {optionsRow}
        <div style={{ height: 400, textAlign: 'center' }}>
          <p>Error: could not retrieve grade distribution data.</p>
        </div>
      </div>
    );
  }
};

export default GradeDist;
