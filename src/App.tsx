import React, { useCallback, useState } from 'react'
import { Button, TextField } from '@material-ui/core';
import { makeStyles, createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import blue from '@material-ui/core/colors/blue';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import CssBaseline from '@material-ui/core/CssBaseline';
import txTemplate from './templates/uniswap'
import { InputId } from './model/templates';
import { buildTemplate } from './utils/encoding';

const useStyles = makeStyles((theme) => ({
  content: {
    padding: "16px"
  },
  input: {
    width: "100%"
  }
}));


const updateUserInputs = (inputs: Record<string, string>, id: string, input: string) => {
  const newInputs = { ...inputs }
  newInputs[id] = input
  return newInputs
}

const App = () => {
  const classes = useStyles();
  const [userInputs, setUserInputs] = useState<Record<InputId, string>>({})
  const template = txTemplate

  const build = useCallback(async () => {
    try {
      console.log(buildTemplate(template, userInputs))
    } catch (e) {
      console.error(e)
    }
  }, [userInputs, template])

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = React.useMemo(() => createMuiTheme({
    palette: {
      type: prefersDarkMode ? 'dark' : 'light',
      primary: blue,
    },
  }), [prefersDarkMode])
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className={classes.content}>
        <h1>
          Transaction template: {template.name}
        </h1>
        <h3>Inputs</h3>
        {Object.entries(template.inputs).map(([id, input]) => {
          console.log(input)
          switch (input.details.type) {
            case "bn":
            case "json":
              return (
                <TextField
                  placeholder={input.details.hint}
                  label={input.label}
                  value={userInputs[id]}
                  onChange={(e) => { setUserInputs(updateUserInputs(userInputs, id, e.target.value)) }}
                  className={classes.input} />
              )
          }
        })}
        <Button color="primary" onClick={build}>Build</Button>
      </div>
    </ThemeProvider>
  );
}

export default App;
