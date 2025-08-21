import styled from '@emotion/styled';

import { Route, Routes, Link } from 'react-router-dom';

const StyledApp = styled.div`
  // Your style here
`;

export function App() {
  return (
    <StyledApp>
      {/* BREAKING: NxWelcome component removed */}

      {/* START: routes */}
      {/* These routes and navigation have been generated for you */}
      {/* Feel free to move and update them to fit your needs */}
      <br />
      <hr />
      <br />
      <div role="navigation">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
        </ul>
      </div>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <h1>Welcome to Client App!</h1>
              <p>This is the generated root route.</p>
              <Link to="/page-2">Click here for page 2.</Link>
            </div>
          }
        />
        {/* BREAKING: /page-2 route removed */}
      </Routes>
      {/* END: routes */}
    </StyledApp>
  );
}

export default App;
