import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
// import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
// import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import SingleCurrency from './components/SingleCurrency';
import {Box, Container} from '@mui/system';
import {Tab, Tabs, Typography} from '@mui/material';
import {useState} from 'react';
import {TabContent} from './components/TabContent';
import HistoryCurrency from './components/HistoryCurrency';

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

function App() {
  const [currentTab, setCurrentTab] = useState<number>(0);

  return (
    <>
      <Container>
        <Typography variant="h1" sx={{pb: 2}}>
          Exchange API
        </Typography>
        <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
          <Tabs
            value={currentTab}
            onChange={(_e, newValue) => {
              setCurrentTab(newValue);
            }}
          >
            <Tab label="Single Currency Info" {...a11yProps(0)} />
            <Tab label="Historical Currency API" {...a11yProps(1)} />
          </Tabs>
        </Box>
        <TabContent value={currentTab} index={0}>
          <SingleCurrency />
        </TabContent>
        <TabContent value={currentTab} index={1}>
          <HistoryCurrency />
        </TabContent>
      </Container>
    </>
  );
}

export default App;
