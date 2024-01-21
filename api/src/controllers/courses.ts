/**
 @module CoursesRoute
*/

import express, { Request } from 'express';
import fetch from 'node-fetch';
import { GenericObject } from '../types/types';
import courseDummy from '../dummy/course.json';
import { getCourseQuery } from '../helpers/gql';
var router = express.Router();

/**
 * PPAPI proxy for course data
 */
router.get('/api', (req: Request<{}, {}, {}, { courseID: string }>, res) => {
  let r = fetch(process.env.PUBLIC_API_URL + 'courses/' + encodeURIComponent(req.query.courseID), {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  console.log(req.query.courseID);

  r.then((response) => response.json()).then((data) => res.send(data.payload));
});

/**
 * PPAPI proxy for course data
 */
router.post('/api/batch', (req: Request<{}, {}, { courses: string[] }>, res) => {
  if (req.body.courses.length == 0) {
    res.json({});
  } else {
    let r = fetch(process.env.PUBLIC_API_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: getCourseQuery(req.body.courses),
      }),
    });

    r.then((response) => response.json()).then((data) =>
      res.json(
        Object.fromEntries(
          Object.entries(data.data)
            .filter(([_, x]) => x !== null)
            .map(([_, x]) => [(x as { id: string }).id, x]),
        ),
      ),
    );
  }
});

/**
 * PPAPI proxy for grade distribution
 */
router.get('/api/grades', (req: Request<{}, {}, {}, { department: string; number: string }>, res) => {
  let r = fetch(
    process.env.PUBLIC_API_URL +
      'grades/raw?department=' +
      encodeURIComponent(req.query.department) +
      '&courseNumber=' +
      req.query.number,
  );

  r.then((response) => response.json()).then((data) => {
    res.send(data.payload);
  });
});

export default router;
