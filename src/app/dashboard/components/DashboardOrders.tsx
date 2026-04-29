'use client';

/* eslint-disable  */
import { api } from '@/trpc/react';
import styles from '@/styles/Dashboard.module.css';
import { Alert, Button } from 'react-bootstrap';

import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import 'react-datetime/css/react-datetime.css';
import { Formater, DateFormater } from '@/lib/utils';
import {
  Box,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';

import { ExportToCsv } from 'export-to-csv';
import { Loader } from './Loader';

// import { useRouter } from "next/router";
import { Fade } from '@mui/material';
import { PrimitiveDot } from '@/components/icons';
const SendIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='16.5'
    height='16.5'
    viewBox='0 0 16.5 16.5'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    className='lucide lucide-send'
  >
    <path d='M2.75 15.75L13.75 8.25L2.75 0.75V6.75' />
    <path d='M13.75 8.25H6.75' />
  </svg>
);
const DashboardOrders = () => {
  // const { locale } = useRouter();
  const [open, setOpen] = useState({
    opened: false,
    orderID: '',
  });
  const [resend, setResend] = useState({
    open: false,
    id: '',
  });
  const [show, setShow] = useState({ modal: false, data: '' });
  const { mutateAsync: sendEmail } = api.Order.sendEmail.useMutation();
  const { mutateAsync } = api.Winners.getCSV.useMutation();
  const { data: orders, refetch: refetchOrders } = api.Order.getAll.useQuery(
    show.data,
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const { data, isLoading } = api.Competition.getAll.useQuery();
  // this is for the edit email stuff
  const {
    mutateAsync: updateEmail,
    isLoading: updateEmailLoading,
    isError: updateEmailError,
  } = api.Order.updateEmail.useMutation();
  // the edit index is for the order that we want to edit the email from
  const [editIdx, setEditIdx] = useState<
    | {
        id: string;
        new_email: string;
      }
    | undefined
  >();

  const handleClose = () => {
    setShow({ modal: false, data: '' });
  };
  const handleShow = (i: string) => {
    setShow({
      modal: true,
      data: i,
    });
  };

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
    <div className={styles.DashCompsMain}>
      <div className={styles.dashCompsTopHeader}>
        <h1>Your Orders</h1>
      </div>
      {isLoading || data === null || !data ? (
        <div className={styles.LoaderWrapper}>
          <Loader />
        </div>
      ) : (
        <div className={styles.dashCompsGrid}>
          {data.map((comp) => {
            if (comp === null || comp.Watches === null) return null;
            return (
              <div className={styles.dashGridItem} key={comp.id}>
                <h2>{comp.name}</h2>
                <div className={styles.dashGridItemTop}>
                  <p>Creating date : {comp.createdAt.toDateString()}</p>
                  <p>Drawing date : {comp.drawing_date.toDateString()}</p>
                  <p>Ends : {comp.end_date.toDateString()}</p>
                  <p>Remaining Tickets : {comp.remaining_tickets}</p>
                  <p>
                    Prize : {comp.Watches.brand} {comp.Watches.model}
                  </p>
                  {comp.winner && <p>Winner : {comp.winner}</p>}
                </div>
                <div className={styles.dashGridItemBot}>
                  <div>
                    <Button
                      variant='secondary'
                      onClick={async () => {
                        new ExportToCsv({
                          fieldSeparator: ',',
                          quoteStrings: '"',
                          decimalSeparator: '.',
                          showLabels: true,
                          showTitle: false,
                          title: 'Order',
                          useTextFile: false,
                          useBom: true,
                          useKeysAsHeaders: true,
                          // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
                        }).generateCsv(await mutateAsync(comp.id));
                      }}
                    >
                      CSV
                    </Button>
                    <Button
                      variant='secondary'
                      onClick={() => handleShow(comp.id)}
                    >
                      Manage
                    </Button>
                  </div>
                  <span
                    style={{
                      color:
                        comp.status === 'ACTIVE'
                          ? 'green'
                          : comp.status === 'NOT_ACTIVE'
                            ? 'red'
                            : 'blue',
                    }}
                  >
                    <PrimitiveDot />
                    {comp.status.valueOf() === 'COMPLETED'
                      ? 'COMPLETED'
                      : comp.status.valueOf() === 'NOT_ACTIVE'
                        ? 'NOT ACTIVE'
                        : 'ACTIVE'}
                  </span>
                </div>
                {show.data === comp.id && (
                  <Modal
                    style={{ width: '100vw' }}
                    size='xl'
                    show={show.modal}
                    onHide={handleClose}
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>Manage your competition</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <Paper sx={{ width: '100%', mb: 2 }}>
                        <TableContainer component={Paper}>
                          <Table
                            style={{ tableLayout: 'auto' }}
                            aria-label='collapsible table'
                          >
                            <TableHead>
                              <TableRow>
                                <TableCell>
                                  <p style={{ marginBottom: '0' }}>Full Name</p>
                                </TableCell>
                                <TableCell align='center'>
                                  <p style={{ marginBottom: '0' }}>
                                    Country
                                    <br />
                                    Town
                                  </p>
                                </TableCell>
                                <TableCell align='right'>
                                  <p style={{ marginBottom: '0' }}>
                                    Payment Method
                                  </p>
                                </TableCell>
                                <TableCell align='right'>
                                  <p style={{ marginBottom: '0' }}>
                                    Total Price
                                  </p>
                                </TableCell>
                                <TableCell align='right'>
                                  <p style={{ marginBottom: '0' }}>Status</p>
                                </TableCell>
                                <TableCell align='right'>
                                  <p style={{ marginBottom: '0' }}>Email</p>
                                </TableCell>
                                <TableCell align='center'>
                                  <p style={{ marginBottom: '0' }}>
                                    Zip - Phone - Address
                                  </p>
                                </TableCell>
                                <TableCell align='right'>
                                  <p style={{ marginBottom: '0' }}>
                                    Date of Birth
                                  </p>
                                </TableCell>
                                <TableCell align='right'>
                                  <p style={{ marginBottom: '0' }}>
                                    Checked Email
                                  </p>
                                </TableCell>
                                <TableCell align='right'>
                                  <p style={{ marginBottom: '0' }}>
                                    Checked Terms
                                  </p>
                                </TableCell>
                                <TableCell align='right'>
                                  <p style={{ marginBottom: '0' }}>
                                    Created At
                                  </p>
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {orders
                                ?.slice(
                                  page * rowsPerPage,
                                  page * rowsPerPage + rowsPerPage,
                                )
                                .filter(
                                  (order) =>
                                    order.status !== 'INCOMPLETE' &&
                                    order.status !== 'PENDING',
                                )
                                .map((row) => (
                                  <>
                                    <TableRow
                                      key={row.id}
                                      hover
                                      onClick={() =>
                                        setOpen({
                                          opened: !open.opened,
                                          orderID: row.id,
                                        })
                                      }
                                      sx={{
                                        '& > *': {
                                          borderBottom: 'unset',
                                          cursor: 'pointer',
                                        },
                                      }}
                                    >
                                      <TableCell component='th' scope='row'>
                                        {row.first_name} {row.last_name}
                                      </TableCell>

                                      <TableCell align='right'>
                                        {row.country}
                                        <br />
                                        {row.town}
                                      </TableCell>
                                      <TableCell align='right'>
                                        {row.paymentMethod}
                                      </TableCell>
                                      <TableCell align='right'>
                                        {/* (t.ticketprice * (1 - t.reduction)) * (1 - t.affiliation_reduction) */}
                                        {row.Ticket[0]?.ticketPrice != 0
                                          ? row.Ticket[0]!.ticketPrice *
                                            (1 - row.Ticket[0]!.reduction!) *
                                            (1 -
                                              row.Ticket[0]!
                                                .affiliation_reduction!) *
                                            row.Ticket.length
                                          : row.totalPrice}{' '}
                                        £
                                      </TableCell>
                                      <TableCell align='right'>
                                        {row.status}
                                      </TableCell>
                                      <TableCell
                                        onClick={() => {
                                          setEditIdx({
                                            id: row.id,
                                            new_email: row.email,
                                          });
                                        }}
                                        align='right'
                                      >
                                        {editIdx?.id === row.id ? (
                                          <TextField
                                            value={editIdx.new_email}
                                            onChange={(e) =>
                                              setEditIdx({
                                                id: row.id,
                                                new_email: e.target.value,
                                              })
                                            }
                                            autoFocus
                                            fullWidth
                                            disabled={updateEmailLoading}
                                            InputProps={{
                                              endAdornment: (
                                                <InputAdornment position='end'>
                                                  <IconButton
                                                    onClick={async () => {
                                                      await updateEmail({
                                                        id: editIdx.id,
                                                        new_email:
                                                          editIdx.new_email,
                                                      });
                                                      setEditIdx(undefined);
                                                      await refetchOrders();
                                                    }}
                                                    edge='end'
                                                  >
                                                    <SendIcon />
                                                  </IconButton>
                                                </InputAdornment>
                                              ),
                                            }}
                                          />
                                        ) : (
                                          row.email
                                        )}
                                      </TableCell>

                                      <TableCell align='right'>
                                        <p
                                          style={{
                                            margin: '0',
                                          }}
                                        >
                                          {row.phone ? row.phone : 'No Phone'}
                                          <br />
                                          {row.address
                                            ? row.address
                                            : 'No Address'}
                                          <br />
                                          {row.zip}
                                        </p>
                                      </TableCell>
                                      <TableCell align='right'>
                                        {row.date !== null
                                          ? DateFormater(row.date)
                                          : 'Birthday not provided'}
                                      </TableCell>
                                      <TableCell align='right'>
                                        {row.checkedEmail ? 'Yes' : 'No'}
                                      </TableCell>
                                      <TableCell align='right'>
                                        {row.checkedTerms ? 'Yes' : 'No'}
                                      </TableCell>
                                      <TableCell align='right'>
                                        {DateFormater(row.createdAt)}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell
                                        style={{
                                          paddingBottom: 0,
                                          paddingTop: 0,
                                        }}
                                        colSpan={6}
                                      >
                                        <Collapse
                                          in={
                                            row.id === open.orderID &&
                                            open.opened
                                          }
                                          timeout='auto'
                                          unmountOnExit
                                        >
                                          <Box
                                            sx={{
                                              margin: 1,
                                              width: '100%',
                                            }}
                                          >
                                            {row.id === resend.id && (
                                              <Fade
                                                in={resend.open} //Write the needed condition here to make it appear
                                                timeout={{
                                                  enter: 1000,
                                                  exit: 1000,
                                                }} //Edit these two values to change the duration of transition when the element is getting appeared and disappeard
                                                addEndListener={() => {
                                                  setTimeout(() => {
                                                    setResend({
                                                      open: false,
                                                      id: '',
                                                    });
                                                  }, 2000);
                                                }}
                                              >
                                                <Alert
                                                  style={{
                                                    transition: ' 0.5s all',
                                                  }}
                                                  variant='success'
                                                >
                                                  Email Resent!
                                                </Alert>
                                              </Fade>
                                            )}
                                            <Box
                                              sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                              }}
                                            >
                                              <Typography
                                                variant='h6'
                                                gutterBottom
                                                component='div'
                                              >
                                                Tickets
                                              </Typography>

                                              <Button
                                                onClick={async () => {
                                                  setResend({
                                                    open: !resend.open,
                                                    id: row.id,
                                                  });
                                                  await sendEmail(row.id);
                                                }}
                                                size='sm'
                                                style={{
                                                  width: 'max-content',
                                                }}
                                              >
                                                Resend Email
                                              </Button>
                                            </Box>

                                            <Table
                                              size='small'
                                              aria-label='purchases'
                                            >
                                              <TableHead>
                                                <TableRow>
                                                  <TableCell>
                                                    Ticket Number
                                                  </TableCell>
                                                  <TableCell>
                                                    First Name
                                                  </TableCell>
                                                  <TableCell align='right'>
                                                    Last Name
                                                  </TableCell>
                                                  <TableCell align='right'>
                                                    Price Per Ticket
                                                  </TableCell>
                                                  <TableCell align='right'>
                                                    Ticket ID
                                                  </TableCell>
                                                </TableRow>
                                              </TableHead>
                                              <TableBody sx={{ width: '100%' }}>
                                                {row.Ticket.map((ticket) => (
                                                  <TableRow key={ticket.id}>
                                                    <TableCell
                                                      component='th'
                                                      scope='row'
                                                    >
                                                      1
                                                    </TableCell>
                                                    <TableCell>
                                                      {row.first_name}
                                                    </TableCell>
                                                    <TableCell align='right'>
                                                      {row.last_name}
                                                    </TableCell>
                                                    <TableCell align='right'>
                                                      {Formater(
                                                        row.Ticket[0]!
                                                          .ticketPrice != 0
                                                          ? row.Ticket[0]!
                                                              .ticketPrice *
                                                              (1 -
                                                                row.Ticket[0]!
                                                                  .reduction!) *
                                                              (1 -
                                                                row.Ticket[0]!
                                                                  .affiliation_reduction!)
                                                          : row.totalPrice /
                                                              row.Ticket.length,
                                                      )}
                                                    </TableCell>
                                                    <TableCell align='right'>
                                                      {ticket.id.toUpperCase()}
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </Box>
                                        </Collapse>
                                      </TableCell>
                                    </TableRow>
                                  </>
                                ))}
                            </TableBody>
                          </Table>
                          <TablePagination
                            rowsPerPageOptions={[5, 15, 100]}
                            component='div'
                            count={orders ? orders.length : -1}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                          />
                        </TableContainer>
                      </Paper>
                    </Modal.Body>
                  </Modal>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardOrders;
