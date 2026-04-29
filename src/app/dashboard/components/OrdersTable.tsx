'use client';

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { IoIosArrowUp, IoIosArrowDown } from 'react-icons/io';
import TablePagination from '@mui/material/TablePagination';
import { Fragment, useState } from 'react';

function createData(
  address: string,
  checkedEmail: boolean,
  checkedTerms: boolean,
  country: string,
  createdAt: Date,
  date: Date,
  email: string,
  first_name: string,
  id: string,
  last_name: string,
  paymentId: string,
  paymentMethod: string,
  phone: string,
  status: string,
  totalPrice: number,
  town: string,
  updatedAt: Date,
  zip: string,
) {
  return {
    address,
    checkedEmail,

    checkedTerms,

    country,

    createdAt,

    date,

    email,

    first_name,

    id,

    last_name,

    paymentId,

    paymentMethod,

    phone,

    status,

    totalPrice,

    town,

    updatedAt,

    zip,
  };
}
interface Orders {
  address: string;
  checkedEmail: boolean;
  checkedTerms: boolean;
  country: string;
  createdAt: Date;
  date: Date;
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  paymentId: string;
  paymentMethod: string;
  phone: string;
  status: string;
  totalPrice: number;
  town: string;
  updatedAt: Date;
  zip: string;
}
function Row(props: { row: ReturnType<typeof createData> }) {
  const { row } = props;
  const [open, setOpen] = useState(false);

  return (
    <Fragment>
      <TableRow
        hover
        onClick={() => setOpen(!open)}
        sx={{ '& > *': { borderBottom: 'unset', cursor: 'pointer' } }}
      >
        <TableCell>
          <IconButton
            aria-label='expand row'
            size='small'
            onClick={() => setOpen(!open)}
          >
            {open ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell component='th' scope='row'>
          {row.first_name}
        </TableCell>
        <TableCell align='right'>{row.last_name}</TableCell>
        <TableCell align='right'>{row.totalPrice}</TableCell>
        <TableCell align='right'>{row.status}</TableCell>
        <TableCell align='right'>{row.paymentMethod}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout='auto' unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant='h6' gutterBottom component='div'>
                History
              </Typography>
              <Table size='small' aria-label='purchases'>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align='right'>Amount</TableCell>
                    <TableCell align='right'>Total price ($)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell component='th' scope='row'>
                      {row.first_name}
                    </TableCell>
                    <TableCell>{row.first_name}</TableCell>
                    <TableCell align='right'>{row.first_name}</TableCell>
                    <TableCell align='right'>
                      {Math.round(row.totalPrice * row.totalPrice * 100) / 100}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

export default function CollapsibleTable(orders: Array<Orders>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <TableContainer component={Paper}>
        <Table aria-label='collapsible table'>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>
                <p style={{ marginBottom: '0' }}>Dessert (100g serving)</p>
              </TableCell>
              <TableCell align='right'>
                <p style={{ marginBottom: '0' }}>Calories</p>
              </TableCell>
              <TableCell align='right'>
                <p style={{ marginBottom: '0' }}>Fat&nbsp;(g)</p>
              </TableCell>
              <TableCell align='right'>
                <p style={{ marginBottom: '0' }}>Carbs&nbsp;(g)</p>
              </TableCell>
              <TableCell align='right'>
                <p style={{ marginBottom: '0' }}>Protein&nbsp;(g)</p>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((row) => (
              <Row key={row.id} row={row} />
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 15, 100]}
          component='div'
          count={orders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Paper>
  );
}
