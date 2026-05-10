import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../utils/routes';
const Setup = () => {
    const { isAuthenticated, authResolved } = useSelector((state) => state.config);
    if (authResolved && isAuthenticated) {
        return <Navigate to={ROUTES.userDashboard} replace/>;
    }
    return <Navigate to={ROUTES.home} replace/>;
};
export default Setup;
