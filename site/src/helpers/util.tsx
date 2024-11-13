import {
  SearchIndex,
  CourseGQLData,
  ProfessorGQLData,
  BatchCourseData,
  BatchProfessorData,
  SearchType,
  CourseWithTermsLookup,
} from '../types/types';
import { useMediaQuery } from 'react-responsive';
import trpc from '../trpc';
import { CourseAAPIResponse, ProfessorAAPIResponse } from '@peterportal/types';

export function getCourseTags(course: CourseGQLData) {
  // data to be displayed in pills
  const tags: string[] = [];
  // units
  const { minUnits, maxUnits } = course;
  tags.push(
    `${minUnits === maxUnits ? maxUnits : `${minUnits}-${maxUnits}`} unit${
      minUnits === maxUnits ? (maxUnits !== 1 ? 's' : '') : 's'
    }`,
  );
  // course level
  const courseLevel = course.courseLevel;
  if (courseLevel) {
    tags.push(`${courseLevel.substring(0, courseLevel.indexOf('('))}`);
  }
  // ge
  course.geList.forEach((ge) => {
    tags.push(`${ge.substring(0, ge.indexOf(':'))}`);
  });
  return tags;
}

// helper function to search 1 result from course/professor page
export function searchAPIResult(type: SearchType, name: string) {
  return new Promise<CourseGQLData | ProfessorGQLData | undefined>((res) => {
    let index: SearchIndex;
    if (type === 'course') {
      index = 'courses';
    } else {
      index = 'professors';
    }
    searchAPIResults(index, [name]).then((results) => {
      if (Object.keys(results).length > 0) {
        const key = Object.keys(results)[0];
        res(results[key]);
      } else {
        res(undefined);
      }
    });
  });
}

// helper function to query from API and transform to data used in redux
export async function searchAPIResults(
  index: SearchIndex,
  names: string[],
): Promise<BatchCourseData | BatchProfessorData> {
  const data =
    index === 'courses'
      ? await trpc.courses.batch.mutate({ courses: names })
      : await trpc.professors.batch.mutate({ professors: names });

  const transformed: BatchCourseData | BatchProfessorData = {};
  for (const id in data) {
    if (data[id]) {
      // use specific key based on index
      let key = '';
      if (index == 'courses') {
        key = (data[id] as CourseAAPIResponse).id;
      } else {
        key = (data[id] as ProfessorAAPIResponse).ucinetid;
      }
      // perform transformation
      transformed[key] = transformGQLData(index, data[id]);
    }
  }
  return transformed;
}

export const hourMinuteTo12HourString = ({ hour, minute }: { hour: number; minute: number }) =>
  `${hour === 12 ? 12 : hour % 12}:${minute.toString().padStart(2, '0')} ${Math.floor(hour / 12) === 0 ? 'AM' : 'PM'}`;

function transformCourseGQL(data: CourseAAPIResponse) {
  // create copy to override fields with lookups
  const course = { ...data } as unknown as CourseGQLData;
  course.instructors = Object.fromEntries(data.instructors.map((instructor) => [instructor.ucinetid, instructor]));
  course.prerequisites = Object.fromEntries(data.prerequisites.map((prerequisite) => [prerequisite.id, prerequisite]));
  course.dependencies = Object.fromEntries(data.dependencies.map((dependency) => [dependency.id, dependency]));
  return course;
}

/** @todo should move transformations to backend? check performance */
// transforms PPAPI gql schema to our needs
export function transformGQLData(index: SearchIndex, data: CourseAAPIResponse | ProfessorAAPIResponse) {
  if (index == 'courses') {
    return transformCourseGQL(data as CourseAAPIResponse);
  } else {
    return transformProfessorGQL(data as ProfessorAAPIResponse);
  }
}

function transformProfessorGQL(data: ProfessorAAPIResponse) {
  // create copy to override fields with lookups
  const professor = { ...data } as unknown as ProfessorGQLData;
  professor.courses = Object.fromEntries(data.courses.map((course) => [course.id, course]));
  return professor;
}

export function useIsDesktop() {
  const isDesktop = useMediaQuery({ minWidth: 800 });
  return isDesktop;
}

export function useIsMobile() {
  const isMobile = useMediaQuery({ maxWidth: 799.9 });
  return isMobile;
}

const quartersOrdered: Record<string, string> = {
  Winter: 'a',
  Spring: 'b',
  Summer1: 'c',
  Summer2: 'd',
  Summer10wk: 'e',
  Fall: 'f',
};

export const sortTerms = (terms: string[]) =>
  [...new Set(terms)].sort((a, b) => {
    const [yearA, qtrA]: string[] = a.split(' ');
    const [yearB, qtrB]: string[] = b.split(' ');
    // first compare years (descending)
    // if years are equal, compare terms (most recent first)
    return yearB.localeCompare(yearA) || quartersOrdered[qtrB].localeCompare(quartersOrdered[qtrA]);
  });

export const unionTerms = (courseHistory: CourseWithTermsLookup) => {
  // get array of arrays of term names
  const allTerms = Object.values(courseHistory);

  // flatten and take union of array
  const union = allTerms.flatMap((term) => term.terms);

  return sortTerms(union);
};
