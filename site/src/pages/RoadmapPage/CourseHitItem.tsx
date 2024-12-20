import { FC } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { useAppDispatch } from '../../store/hooks';
import { setActiveCourse, setShowAddCourse } from '../../store/slices/roadmapSlice';
import Course from './Course';

import { useIsMobile } from '../../helpers/util';
import { CourseGQLData } from '../../types/types';
import { useCoursebag } from '../../hooks/coursebag';

interface CourseHitItemProps extends CourseGQLData {
  index: number;
}

const CourseHitItem: FC<CourseHitItemProps> = (props: CourseHitItemProps) => {
  const dispatch = useAppDispatch();
  const isMobile = useIsMobile();
  const { coursebag, addCourseToBag, removeCourseFromBag } = useCoursebag();
  const isInBag = coursebag.some((course) => course.id === props.id);
  // do not make course draggable on mobile
  const onMobileMouseDown = () => {
    dispatch(setActiveCourse(props));
    dispatch(setShowAddCourse(true));
    // also hide the search bar to view the roadmap
  };
  const onMobileKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      onMobileMouseDown();
    }
  };
  const onAddToBag = () => {
    if (!props) return;
    if (props.id === undefined) return;
    if (coursebag.some((course) => course.id === props.id)) return;
    addCourseToBag(props);
  };
  const removeFromBag = () => {
    removeCourseFromBag(props);
  };

  if (isMobile) {
    return (
      <div
        tabIndex={0}
        role="button"
        onMouseDown={onMobileMouseDown}
        onKeyDown={onMobileKeyDown}
        // use inline style here so dnd can calculate size
        style={{ margin: ' 0rem 2rem 1rem 2rem' }}
      >
        <Course {...props} />
      </div>
    );
  }
  // course is draggable on desktop
  else {
    return (
      <Draggable
        key={`search-course-${props.index}`}
        draggableId={`search-${props.id}-${props.index}`}
        index={props.index}
      >
        {(provided) => {
          return (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{
                // use inline style here so dnd can calculate size
                margin: ' 0rem 2rem 1rem 2rem',
                cursor: 'grab',
                ...provided.draggableProps.style,
              }}
            >
              <Course {...props} onAddToBag={onAddToBag} isInBag={isInBag} removeFromBag={removeFromBag} />
            </div>
          );
        }}
      </Draggable>
    );
  }
};

export default CourseHitItem;
