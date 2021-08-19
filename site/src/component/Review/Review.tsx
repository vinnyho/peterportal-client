import React, { FC, useState, useEffect } from 'react';
import axios, { AxiosResponse } from 'axios';
import SubReview from './SubReview';
import ReviewForm from '../ReviewForm/ReviewForm';
import './Review.scss'

import { selectReviews, setReviews } from '../../store/slices/reviewSlice';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { CourseData, ProfessorData, ReviewData } from '../../types/types';

export interface ReviewProps {
    course?: CourseData;
    professor?: ProfessorData;
}

const Review: FC<ReviewProps> = (props) => {
    const dispatch = useAppDispatch();
    const reviewData = useAppSelector(selectReviews);
    const [openForm, setOpenForm] = useState(false);

    const getReviews = async () => {
        interface paramsProps {
            courseID?: string;
            professorID?: string;
        }
        let params: paramsProps = {};
        if (props.course) params['courseID'] = props.course.id;
        if (props.professor) params['professorID'] = props.professor.ucinetid;
        axios.get(`/reviews`, {
            params: params
        })
            .then((res: AxiosResponse<ReviewData[]>) => {
                const data = res.data.filter((review) => review !== null)
                dispatch(setReviews(data));
            });
    }

    useEffect(() => {
        getReviews();
    }, []);

    const openReviewForm = () => {
        setOpenForm(true);
        document.body.style.overflow = 'hidden';
    }
    const closeForm = () => {
        setOpenForm(false);
        document.body.style.overflow = 'visible';
    }

    if (!reviewData) {
        return <p>Loading reviews..</p>;
    } else {
        return (
            <>
                <div className='reviews'>
                    {reviewData.map((review, i) => {
                        if (review !== null) return (<SubReview review={review} key={i} showCourse={props.professor ? true : false} />)
                    })}
                    <button type='button' className='add-review-btn' onClick={openReviewForm}>+ Add Review</button>
                </div>
                {openForm ? (
                    <>
                        <div className='blur-bg' onClick={closeForm} />
                        <ReviewForm {...props} />
                    </>
                ) : null}
            </>
        )
    }
}

export default Review;