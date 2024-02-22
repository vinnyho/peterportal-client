import { FC, useState, useEffect } from 'react';
import axios, { AxiosResponse } from 'axios';
import SubReview from './SubReview';
import ReviewForm from '../ReviewForm/ReviewForm';
import './Review.scss';

import { selectReviews, setReviews, setFormStatus } from '../../store/slices/reviewSlice';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { CourseGQLData, ProfessorGQLData, ReviewData, VoteColorsRequest, VoteColor } from '../../types/types';
import { Checkbox, Dropdown } from 'semantic-ui-react';

export interface ReviewProps {
  course?: CourseGQLData;
  professor?: ProfessorGQLData;
}

enum SortingOption {
  MOST_RECENT,
  TOP_REVIEWS,
  CONTROVERSIAL,
}

const Review: FC<ReviewProps> = (props) => {
  const dispatch = useAppDispatch();
  const reviewData = useAppSelector(selectReviews);
  const [voteColors, setVoteColors] = useState([]);
  const [sortingOption, setSortingOption] = useState<SortingOption>(SortingOption.MOST_RECENT);
  const [filterOption, setFilterOption] = useState('');
  const [showOnlyVerifiedReviews, setShowOnlyVerifiedReviews] = useState(false);

  const getColors = async (vote: VoteColorsRequest) => {
    const res = await axios.patch('/api/reviews/getVoteColors', vote);
    return res.data;
  };

  const getReviews = async () => {
    interface paramsProps {
      courseID?: string;
      professorID?: string;
    }
    const params: paramsProps = {};
    if (props.course) params.courseID = props.course.id;
    if (props.professor) params.professorID = props.professor.ucinetid;
    axios
      .get(`/api/reviews`, {
        params: params,
      })
      .then(async (res: AxiosResponse<ReviewData[]>) => {
        const data = res.data.filter((review) => review !== null);
        const reviewIDs = [];
        for (let i = 0; i < data.length; i++) {
          reviewIDs.push(data[i]._id);
        }
        const req = {
          ids: reviewIDs as string[],
        };
        const colors = await getColors(req);
        setVoteColors(colors);
        dispatch(setReviews(data));
      });
  };

  const updateVoteColors = async () => {
    const reviewIDs = [];
    for (let i = 0; i < reviewData.length; i++) {
      reviewIDs.push(reviewData[i]._id);
    }
    const req = {
      ids: reviewIDs as string[],
    };
    const colors = await getColors(req);
    setVoteColors(colors);
  };

  const getU = (id: string | undefined) => {
    const temp = voteColors as object;
    const v = temp[id as keyof typeof temp] as unknown as number;
    if (v == 1) {
      return {
        colors: [true, false],
      };
    } else if (v == -1) {
      return {
        colors: [false, true],
      };
    }
    return {
      colors: [false, false],
    };
  };
  useEffect(() => {
    // prevent reviews from carrying over
    dispatch(setReviews([]));
    getReviews();
  }, [props.course?.id, props.professor?.ucinetid]);

  let sortedReviews: ReviewData[];
  // filter verified if option is set
  if (showOnlyVerifiedReviews) {
    sortedReviews = reviewData.filter((review) => review.verified);
  } else {
    // if not, clone reviewData since its const
    sortedReviews = reviewData.slice(0);
  }

  if (filterOption.length > 0) {
    if (props.course) {
      // filter course reviews by specific professor
      sortedReviews = sortedReviews.filter((review) => review.professorID === filterOption);
    } else if (props.professor) {
      // filter professor reviews by specific course
      sortedReviews = sortedReviews.filter((review) => review.courseID === filterOption);
    }
  }

  switch (sortingOption) {
    case SortingOption.MOST_RECENT:
      sortedReviews.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      break;
    case SortingOption.TOP_REVIEWS: // the right side of || will fall back to most recent when score is equal
      sortedReviews.sort(
        (a, b) => b.score - a.score || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      break;
    case SortingOption.CONTROVERSIAL:
      sortedReviews.sort(
        (a, b) => a.score - b.score || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      break;
  }

  // calculate frequencies of professors or courses in list of reviews
  let reviewFreq = new Map<string, number>();
  if (props.course) {
    reviewFreq = sortedReviews.reduce(
      (acc, review) => acc.set(review.professorID, (acc.get(review.professorID) || 0) + 1),
      reviewFreq,
    );
  } else if (props.professor) {
    reviewFreq = sortedReviews.reduce(
      (acc, review) => acc.set(review.courseID, (acc.get(review.courseID) || 0) + 1),
      reviewFreq,
    );
  }

  const openReviewForm = () => {
    dispatch(setFormStatus(true));
    document.body.style.overflow = 'hidden';
  };
  const closeForm = () => {
    dispatch(setFormStatus(false));
    document.body.style.overflow = 'visible';
  };

  if (!reviewData) {
    return <p>Loading reviews..</p>;
  } else {
    return (
      <>
        <div className="reviews">
          <div className="sorting-menu row">
            <Dropdown
              placeholder="Sorting Option"
              scrolling
              selection
              options={[
                { text: 'Most Recent', value: SortingOption.MOST_RECENT },
                { text: 'Top Reviews', value: SortingOption.TOP_REVIEWS },
                { text: 'Controversial', value: SortingOption.CONTROVERSIAL },
              ]}
              value={sortingOption}
              onChange={(_, s) => setSortingOption(s.value as SortingOption)}
            />
            {props.course && (
              <Dropdown
                placeholder="Professor"
                scrolling
                selection
                options={
                  // include option for filter to be empty
                  [{ text: 'All Professors', value: '' }].concat(
                    // map course's instructors to dropdown options
                    Object.keys(props.course?.instructors)
                      .map((profID) => {
                        const name = `${props.course?.instructors[profID].name} (${reviewFreq.get(profID) || 0})`;
                        return {
                          text: name,
                          value: profID,
                        };
                      })
                      .sort((a, b) => a.text.localeCompare(b.text)),
                  )
                }
                value={filterOption}
                onChange={(_, s) => setFilterOption(s.value as string)}
              />
            )}
            {props.professor && (
              <Dropdown
                placeholder="Course"
                scrolling
                selection
                options={
                  // include option for filter to be empty
                  [{ text: 'All Courses', value: '' }].concat(
                    // map professor's courses to dropdown options
                    Object.keys(props.professor?.courses)
                      .map((courseID) => {
                        const name =
                          props.professor?.courses[courseID].department +
                          ' ' +
                          props.professor?.courses[courseID].courseNumber +
                          ` (${reviewFreq.get(courseID) || 0})`;
                        return {
                          text: name,
                          value: courseID,
                        };
                      })
                      .sort((a, b) => a.text.localeCompare(b.text)),
                  )
                }
                value={filterOption}
                onChange={(_, s) => setFilterOption(s.value as string)}
              />
            )}
            <div id="checkbox">
              <Checkbox
                label="Show verified reviews only"
                checked={showOnlyVerifiedReviews}
                onChange={() => setShowOnlyVerifiedReviews((state) => !state)}
              />
            </div>
          </div>
          {sortedReviews.map((review) => (
            <SubReview
              review={review}
              key={review._id}
              course={props.course}
              professor={props.professor}
              colors={getU(review._id) as VoteColor}
              colorUpdater={updateVoteColors}
            />
          ))}
          <button type="button" className="add-review-btn" onClick={openReviewForm}>
            + Add Review
          </button>
        </div>
        <ReviewForm closeForm={closeForm} {...props} />
      </>
    );
  }
};

export default Review;
